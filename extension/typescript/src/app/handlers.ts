/**
 * ★ MAIN CUSTOMIZATION POINT: your extension's handlers.
 *
 * Mirrors go/internal/extension/extension.go. Each handler follows the same
 * 4-step pattern: decode, validate, execute, respond.
 *
 * Handler contract:
 *   (originalMessageHex) => [dataHexOrNull, status, errorOrNull]
 *   status 0 = error, 1 = success. See docs/extension-contract.md §4.6.
 *
 * The framework serializes handler calls, so plain module-level state is safe.
 */

import { bytesToHex, hexToBytes } from "../base/encoding.js";
import type { Framework, HandlerResult } from "../base/types.js";

import { commitInputs, decodeSayGoodbye, encodeAttestationResult, policyIdToBytes32 } from "./abi.js";
import {
  OP_COMMAND_EVALUATE_CONSUMER_CREDIT,
  OP_COMMAND_EVALUATE_FASSETS_AGENT_SOLVENCY,
  OP_COMMAND_SAY_GOODBYE,
  OP_COMMAND_SAY_HELLO,
  OP_TYPE_ATTESTATION,
  OP_TYPE_GREETING,
  POLICY_ID_CONSUMER_CREDIT_LINE,
  POLICY_ID_FASSETS_AGENT_SOLVENCY,
} from "./config.js";
import { evaluateReserveAdequacyPolicy, RESULT_CODE, TIER_CODE, validUntilFromNow } from "./policyEngine.js";

// --- Extension state ---------------------------------------------------------
// Serialized by the framework; no locking needed here.
let greetingCount = 0;
let lastGreeting = "";
let farewellCount = 0;
let lastFarewell = "";
let fassetsAgentSolvencyEvaluations = 0;
let lastFassetsAgentSolvencyTier = "";
let consumerCreditEvaluations = 0;
let lastConsumerCreditTier = "";

/** Reset all state. Used by tests; not part of the wire contract. */
export function resetState(): void {
  greetingCount = 0;
  lastGreeting = "";
  farewellCount = 0;
  lastFarewell = "";
  fassetsAgentSolvencyEvaluations = 0;
  lastFassetsAgentSolvencyTier = "";
  consumerCreditEvaluations = 0;
  lastConsumerCreditTier = "";
}

/** Wire handlers to (opType, opCommand) pairs. */
export function register(framework: Framework): void {
  framework.handle(OP_TYPE_GREETING, OP_COMMAND_SAY_HELLO, handleSayHello);
  framework.handle(OP_TYPE_GREETING, OP_COMMAND_SAY_GOODBYE, handleSayGoodbye);
  framework.handle(OP_TYPE_ATTESTATION, OP_COMMAND_EVALUATE_FASSETS_AGENT_SOLVENCY, handleEvaluateFassetsAgentSolvency);
  framework.handle(OP_TYPE_ATTESTATION, OP_COMMAND_EVALUATE_CONSUMER_CREDIT, handleEvaluateConsumerCredit);
}

/** Snapshot returned by GET /state. Mirrors the Go State struct. */
export function reportState(): unknown {
  return {
    greetingCount,
    lastGreeting,
    farewellCount,
    lastFarewell,
    fassetsAgentSolvencyEvaluations,
    lastFassetsAgentSolvencyTier,
    consumerCreditEvaluations,
    lastConsumerCreditTier,
  };
}

/** GREETING/SAY_HELLO — JSON payload {"name": "..."}. */
export function handleSayHello(msg: string): HandlerResult {
  // 1. Decode
  let raw: Uint8Array;
  try {
    raw = hexToBytes(msg);
  } catch (e) {
    return [null, 0, `decoding request: invalid hex: ${String(e)}`];
  }

  let req: unknown;
  try {
    req = JSON.parse(Buffer.from(raw).toString("utf-8"));
  } catch (e) {
    return [null, 0, `decoding request: ${String(e)}`];
  }

  if (typeof req !== "object" || req === null || Array.isArray(req)) {
    return [null, 0, "decoding request: expected a JSON object"];
  }

  // Match Go's DisallowUnknownFields.
  const unknown = Object.keys(req).filter((k) => k !== "name").sort();
  if (unknown.length > 0) {
    return [null, 0, `decoding request: unknown field "${unknown[0]}"`];
  }

  // 2. Validate
  const name = (req as { name?: unknown }).name;
  if (typeof name !== "string" || name === "") {
    return [null, 0, "name must not be empty"];
  }

  // 3. Execute
  greetingCount++;
  const greeting = `Hello, ${name}! Welcome to Flare Confidential Compute.`;
  lastGreeting = greeting;

  // 4. Respond
  const resp = { greeting, greetingNumber: greetingCount };
  return [bytesToHex(Buffer.from(JSON.stringify(resp), "utf-8")), 1, null];
}

/** GREETING/SAY_GOODBYE — ABI-encoded (string name, string reason). */
export function handleSayGoodbye(msg: string): HandlerResult {
  // 1. Decode
  let hex: string;
  try {
    // Normalize through hexToBytes so malformed input fails here, not in viem.
    hex = bytesToHex(hexToBytes(msg));
  } catch (e) {
    return [null, 0, `decoding request: invalid hex: ${String(e)}`];
  }

  let decoded: { name: string; reason: string };
  try {
    decoded = decodeSayGoodbye(hex as `0x${string}`);
  } catch (e) {
    return [null, 0, `decoding request: ${e instanceof Error ? e.message : String(e)}`];
  }

  // 2. Validate
  if (!decoded.name) {
    return [null, 0, "name must not be empty"];
  }

  // 3. Execute
  farewellCount++;
  const farewell = `Goodbye, ${decoded.name}! Reason: ${decoded.reason}`;
  lastFarewell = farewell;

  // 4. Respond
  const resp = { farewell, farewellNumber: farewellCount };
  return [bytesToHex(Buffer.from(JSON.stringify(resp), "utf-8")), 1, null];
}

// --- Shared request-parsing helpers for the ATTESTATION operations ----------

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function isAddress(value: unknown): value is `0x${string}` {
  return typeof value === "string" && ADDRESS_RE.test(value);
}

/** Parses a decimal-string field into a finite, non-negative number. Rejects NaN, Infinity, and negatives. */
function parseNonNegativeDecimal(value: unknown, field: string): number | string {
  if (typeof value !== "string" || value.trim() === "") {
    return `${field} must be a non-empty decimal string`;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return `${field} must be a non-negative decimal number, got "${value}"`;
  }
  return n;
}

function decodeJsonRequest(msg: string, allowedFields: readonly string[]): { req: Record<string, unknown> } | { error: string } {
  let raw: Uint8Array;
  try {
    raw = hexToBytes(msg);
  } catch (e) {
    return { error: `decoding request: invalid hex: ${String(e)}` };
  }

  let req: unknown;
  try {
    req = JSON.parse(Buffer.from(raw).toString("utf-8"));
  } catch (e) {
    return { error: `decoding request: ${String(e)}` };
  }

  if (typeof req !== "object" || req === null || Array.isArray(req)) {
    return { error: "decoding request: expected a JSON object" };
  }

  const unknown = Object.keys(req).filter((k) => !allowedFields.includes(k)).sort();
  if (unknown.length > 0) {
    return { error: `decoding request: unknown field "${unknown[0]}"` };
  }

  return { req: req as Record<string, unknown> };
}

/**
 * ATTESTATION/EVALUATE_FASSETS_AGENT_SOLVENCY — JSON payload.
 *
 * Combines three tiers of input into one composite-reserve check:
 *   1. Public on-chain: onChainCollateralRatioBips (from AssetManager.getAgentInfo)
 *      applied to mintedFAssetValueUsd.
 *   2. Public, FDC-verified: fdcAttestedXrplReserveXrp, converted to USD with
 *      the live ftsoXrpUsdPrice — real use of both FDC and FTSO, not decoration.
 *   3. Private, enclave-only: privateSupplementaryReserveUsd and
 *      privateUndisclosedLiabilitiesUsd, which never appear in the response —
 *      only their keccak256 commitment does.
 */
const FASSETS_AGENT_SOLVENCY_FIELDS = [
  "agentVault",
  "onChainCollateralRatioBips",
  "mintedFAssetValueUsd",
  "fdcAttestedXrplReserveXrp",
  "ftsoXrpUsdPrice",
  "privateSupplementaryReserveUsd",
  "privateUndisclosedLiabilitiesUsd",
] as const;

const REQUIRED_RESERVE_MULTIPLE = 1.5; // 150% of minted FAsset value
const MAX_LIABILITIES_FRACTION_OF_RESERVE = 0.1; // 10% of composite reserve

export function handleEvaluateFassetsAgentSolvency(msg: string): HandlerResult {
  // 1. Decode
  const decoded = decodeJsonRequest(msg, FASSETS_AGENT_SOLVENCY_FIELDS);
  if ("error" in decoded) {
    return [null, 0, decoded.error];
  }
  const req = decoded.req;

  // 2. Validate
  const agentVault = req.agentVault;
  if (!isAddress(agentVault)) {
    return [null, 0, "agentVault must be a 20-byte hex address"];
  }

  const bips = req.onChainCollateralRatioBips;
  if (typeof bips !== "number" || !Number.isFinite(bips) || bips < 0) {
    return [null, 0, "onChainCollateralRatioBips must be a non-negative number"];
  }

  const mintedFAssetValueUsd = parseNonNegativeDecimal(req.mintedFAssetValueUsd, "mintedFAssetValueUsd");
  if (typeof mintedFAssetValueUsd === "string") return [null, 0, mintedFAssetValueUsd];

  const fdcAttestedXrplReserveXrp = parseNonNegativeDecimal(req.fdcAttestedXrplReserveXrp, "fdcAttestedXrplReserveXrp");
  if (typeof fdcAttestedXrplReserveXrp === "string") return [null, 0, fdcAttestedXrplReserveXrp];

  const ftsoXrpUsdPrice = parseNonNegativeDecimal(req.ftsoXrpUsdPrice, "ftsoXrpUsdPrice");
  if (typeof ftsoXrpUsdPrice === "string") return [null, 0, ftsoXrpUsdPrice];

  const privateSupplementaryReserveUsd = parseNonNegativeDecimal(
    req.privateSupplementaryReserveUsd,
    "privateSupplementaryReserveUsd",
  );
  if (typeof privateSupplementaryReserveUsd === "string") return [null, 0, privateSupplementaryReserveUsd];

  const privateUndisclosedLiabilitiesUsd = parseNonNegativeDecimal(
    req.privateUndisclosedLiabilitiesUsd,
    "privateUndisclosedLiabilitiesUsd",
  );
  if (typeof privateUndisclosedLiabilitiesUsd === "string") return [null, 0, privateUndisclosedLiabilitiesUsd];

  // 3. Execute
  const onChainCollateralUsd = (bips / 10000) * mintedFAssetValueUsd;
  const fdcAttestedXrplReserveUsd = fdcAttestedXrplReserveXrp * ftsoXrpUsdPrice;
  const compositeReserveUsd = onChainCollateralUsd + fdcAttestedXrplReserveUsd + privateSupplementaryReserveUsd;
  const requiredReserveUsd = REQUIRED_RESERVE_MULTIPLE * mintedFAssetValueUsd;
  const maxLiabilitiesUsd = MAX_LIABILITIES_FRACTION_OF_RESERVE * compositeReserveUsd;

  const policyResult = evaluateReserveAdequacyPolicy({
    policyId: POLICY_ID_FASSETS_AGENT_SOLVENCY,
    compositeReserveUsd,
    requiredReserveUsd,
    liabilitiesUsd: privateUndisclosedLiabilitiesUsd,
    maxLiabilitiesUsd,
  });

  const inputCommitment = commitInputs(req);
  const validUntil = validUntilFromNow();

  fassetsAgentSolvencyEvaluations++;
  lastFassetsAgentSolvencyTier = policyResult.tier;

  // 4. Respond — ABI-encoded so AttestationRegistry.sol can abi.decode it directly.
  const data = encodeAttestationResult({
    policyId: policyIdToBytes32(POLICY_ID_FASSETS_AGENT_SOLVENCY),
    subject: agentVault,
    result: RESULT_CODE[policyResult.outcome],
    tier: TIER_CODE[policyResult.tier],
    validUntil,
    inputCommitment,
  });

  return [data, 1, null];
}

/**
 * ATTESTATION/EVALUATE_CONSUMER_CREDIT — JSON payload.
 *
 * Same policy engine as the FAssets vertical, proving the "same engine,
 * different policy" design: publicWalletBalanceUsd plays the role of the
 * on-chain-verified reserve, and 30% of privateIncomeUsd plays the role of
 * the private supplementary reserve.
 */
const CONSUMER_CREDIT_FIELDS = [
  "subject",
  "requestedCreditUsd",
  "publicWalletBalanceUsd",
  "privateIncomeUsd",
  "privateLiabilitiesUsd",
] as const;

const REQUIRED_CREDIT_COVERAGE_MULTIPLE = 1.2; // composite funds must cover 120% of requested credit
const INCOME_CREDIT_WEIGHT = 0.3; // only 30% of declared income counts toward the reserve
const MAX_LIABILITIES_FRACTION_OF_FUNDS = 0.4; // liabilities capped at 40% of balance + income

export function handleEvaluateConsumerCredit(msg: string): HandlerResult {
  // 1. Decode
  const decoded = decodeJsonRequest(msg, CONSUMER_CREDIT_FIELDS);
  if ("error" in decoded) {
    return [null, 0, decoded.error];
  }
  const req = decoded.req;

  // 2. Validate
  const subject = req.subject;
  if (!isAddress(subject)) {
    return [null, 0, "subject must be a 20-byte hex address"];
  }

  const requestedCreditUsd = parseNonNegativeDecimal(req.requestedCreditUsd, "requestedCreditUsd");
  if (typeof requestedCreditUsd === "string") return [null, 0, requestedCreditUsd];

  const publicWalletBalanceUsd = parseNonNegativeDecimal(req.publicWalletBalanceUsd, "publicWalletBalanceUsd");
  if (typeof publicWalletBalanceUsd === "string") return [null, 0, publicWalletBalanceUsd];

  const privateIncomeUsd = parseNonNegativeDecimal(req.privateIncomeUsd, "privateIncomeUsd");
  if (typeof privateIncomeUsd === "string") return [null, 0, privateIncomeUsd];

  const privateLiabilitiesUsd = parseNonNegativeDecimal(req.privateLiabilitiesUsd, "privateLiabilitiesUsd");
  if (typeof privateLiabilitiesUsd === "string") return [null, 0, privateLiabilitiesUsd];

  if (requestedCreditUsd <= 0) {
    return [null, 0, "requestedCreditUsd must be greater than zero"];
  }

  // 3. Execute
  const totalFundsUsd = publicWalletBalanceUsd + privateIncomeUsd;
  const compositeReserveUsd = publicWalletBalanceUsd + privateIncomeUsd * INCOME_CREDIT_WEIGHT;
  const requiredReserveUsd = REQUIRED_CREDIT_COVERAGE_MULTIPLE * requestedCreditUsd;
  const maxLiabilitiesUsd = MAX_LIABILITIES_FRACTION_OF_FUNDS * totalFundsUsd;

  const policyResult = evaluateReserveAdequacyPolicy({
    policyId: POLICY_ID_CONSUMER_CREDIT_LINE,
    compositeReserveUsd,
    requiredReserveUsd,
    liabilitiesUsd: privateLiabilitiesUsd,
    maxLiabilitiesUsd,
  });

  const inputCommitment = commitInputs(req);
  const validUntil = validUntilFromNow();

  consumerCreditEvaluations++;
  lastConsumerCreditTier = policyResult.tier;

  // 4. Respond — ABI-encoded so AttestationRegistry.sol can abi.decode it directly.
  const data = encodeAttestationResult({
    policyId: policyIdToBytes32(POLICY_ID_CONSUMER_CREDIT_LINE),
    subject,
    result: RESULT_CODE[policyResult.outcome],
    tier: TIER_CODE[policyResult.tier],
    validUntil,
    inputCommitment,
  });

  return [data, 1, null];
}
