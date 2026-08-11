/**
 * ★ Solvra's core policy engine.
 *
 * Both of Solvra's real operations — FAssets agent solvency and consumer
 * credit-line eligibility — are instances of the same underlying question:
 * "does a composite reserve of public + verified + private funds cover a
 * required amount, while disclosed/undisclosed liabilities stay within a
 * cap?" This module implements that question exactly once; each handler in
 * handlers.ts only computes the policy-specific inputs and calls in here.
 *
 * This is intentionally deterministic and side-effect free so it can be
 * covered by plain unit tests without any TEE/network machinery.
 */

export type PolicyOutcome = "PASS" | "FAIL";
export type PolicyTier = "A" | "B" | "C" | "FAIL";

/** On-chain encoding: 0 = FAIL, 1 = PASS. Matches AttestationRegistry's uint8 result field. */
export const RESULT_CODE: Record<PolicyOutcome, number> = {
  FAIL: 0,
  PASS: 1,
};

/** On-chain encoding: 0 = FAIL, 1 = C, 2 = B, 3 = A. Matches AttestationRegistry's uint8 tier field. */
export const TIER_CODE: Record<PolicyTier, number> = {
  FAIL: 0,
  C: 1,
  B: 2,
  A: 3,
};

export interface ReserveAdequacyInput {
  /** Stable identifier of the policy being evaluated, e.g. "fassets-agent-solvency-v1". */
  policyId: string;
  /** Sum of every reserve source (public on-chain, FDC-verified, and private) in USD. */
  compositeReserveUsd: number;
  /** Minimum composite reserve required for the policy to pass at all, in USD. */
  requiredReserveUsd: number;
  /** Liabilities being checked against the cap, in USD. */
  liabilitiesUsd: number;
  /** Maximum liabilities allowed, in USD. */
  maxLiabilitiesUsd: number;
}

export interface PolicyResult {
  policyId: string;
  outcome: PolicyOutcome;
  tier: PolicyTier;
  /** compositeReserveUsd / requiredReserveUsd — the raw headroom ratio, kept for transparency/logging. */
  reserveRatio: number;
  liabilitiesOk: boolean;
}

/** reserveRatio >= 2.0 => A, >= 1.5 => B, >= 1.0 (policy passes) => C, otherwise FAIL. */
export function tierFromRatio(reserveRatio: number): PolicyTier {
  if (reserveRatio >= 2.0) return "A";
  if (reserveRatio >= 1.5) return "B";
  if (reserveRatio >= 1.0) return "C";
  return "FAIL";
}

/**
 * The single scoring/tiering core shared by every Solvra policy.
 *
 * A policy passes only if BOTH hold:
 *   1. compositeReserveUsd >= requiredReserveUsd (reserveRatio >= 1.0)
 *   2. liabilitiesUsd <= maxLiabilitiesUsd
 */
export function evaluateReserveAdequacyPolicy(input: ReserveAdequacyInput): PolicyResult {
  const { policyId, compositeReserveUsd, requiredReserveUsd, liabilitiesUsd, maxLiabilitiesUsd } = input;

  const reserveRatio = requiredReserveUsd > 0 ? compositeReserveUsd / requiredReserveUsd : Number.POSITIVE_INFINITY;
  const liabilitiesOk = liabilitiesUsd <= maxLiabilitiesUsd;
  const reservesOk = reserveRatio >= 1.0;

  if (!reservesOk || !liabilitiesOk) {
    return { policyId, outcome: "FAIL", tier: "FAIL", reserveRatio, liabilitiesOk };
  }

  return { policyId, outcome: "PASS", tier: tierFromRatio(reserveRatio), reserveRatio, liabilitiesOk };
}

/** Seconds an attestation stays valid for after issuance. */
export const ATTESTATION_VALIDITY_SECONDS = 24 * 60 * 60;

export function validUntilFromNow(nowUnixSeconds: number = Math.floor(Date.now() / 1000)): bigint {
  return BigInt(nowUnixSeconds + ATTESTATION_VALIDITY_SECONDS);
}
