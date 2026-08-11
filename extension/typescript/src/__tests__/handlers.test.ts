/** Hello World handlers — behaviour must match go/internal/extension/extension.go. */

import { decodeAbiParameters, encodeAbiParameters } from "viem";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import * as handlers from "../app/handlers.js";
import { bytesToHex, hexToBytes } from "../base/encoding.js";
import type { HandlerResult } from "../base/types.js";

const ATTESTATION_RESULT_PARAMS = [
  { name: "policyId", type: "bytes32" },
  { name: "subject", type: "address" },
  { name: "result", type: "uint8" },
  { name: "tier", type: "uint8" },
  { name: "validUntil", type: "uint256" },
  { name: "inputCommitment", type: "bytes32" },
] as const;

function decodeAttestation(result: HandlerResult) {
  const [policyId, subject, resultCode, tier, validUntil, inputCommitment] = decodeAbiParameters(
    ATTESTATION_RESULT_PARAMS,
    result[0] as `0x${string}`,
  );
  return { policyId, subject, resultCode, tier, validUntil, inputCommitment };
}

function bytes32ToAscii(hex: string): string {
  return Buffer.from(hex.slice(2), "hex").toString("utf-8").replace(/\0+$/, "");
}

const AGENT_VAULT = `0x${"11".repeat(20)}` as `0x${string}`;
const SUBJECT = `0x${"22".repeat(20)}` as `0x${string}`;

const GOODBYE_PARAMS = [
  {
    type: "tuple",
    components: [
      { name: "name", type: "string" },
      { name: "reason", type: "string" },
    ],
  },
] as const;

function jsonMsg(obj: unknown): string {
  return bytesToHex(Buffer.from(JSON.stringify(obj), "utf-8"));
}

function goodbyeMsg(name: string, reason: string): string {
  return encodeAbiParameters(GOODBYE_PARAMS, [{ name, reason }]);
}

function parseData(result: HandlerResult): Record<string, unknown> {
  return JSON.parse(Buffer.from(hexToBytes(result[0]!)).toString("utf-8"));
}

beforeEach(() => handlers.resetState());
afterEach(() => handlers.resetState());

describe("handleSayHello", () => {
  it("greets and returns the counter", () => {
    const r = handlers.handleSayHello(jsonMsg({ name: "World" }));
    expect([r[1], r[2]]).toEqual([1, null]);
    expect(parseData(r)).toEqual({
      greeting: "Hello, World! Welcome to Flare Confidential Compute.",
      greetingNumber: 1,
    });
  });

  it("increments the counter across calls", () => {
    for (const expected of [1, 2, 3]) {
      const r = handlers.handleSayHello(jsonMsg({ name: "A" }));
      expect(parseData(r).greetingNumber).toBe(expected);
    }
  });

  it("rejects an empty name", () => {
    const r = handlers.handleSayHello(jsonMsg({ name: "" }));
    expect([r[0], r[1]]).toEqual([null, 0]);
    expect(r[2]).toContain("name must not be empty");
  });

  it("rejects a missing name", () => {
    const r = handlers.handleSayHello(jsonMsg({}));
    expect(r[1]).toBe(0);
    expect(r[2]).toContain("name must not be empty");
  });

  it("rejects unknown fields, matching Go's DisallowUnknownFields", () => {
    const r = handlers.handleSayHello(jsonMsg({ name: "A", extra: 1 }));
    expect(r[1]).toBe(0);
    expect(r[2]).toContain("unknown field");
  });

  it("rejects invalid JSON", () => {
    const r = handlers.handleSayHello(bytesToHex(Buffer.from("not json")));
    expect(r[1]).toBe(0);
    expect(r[2]).toContain("decoding request");
  });

  it("rejects invalid hex", () => {
    const r = handlers.handleSayHello("0xZZ");
    expect(r[1]).toBe(0);
    expect(r[2]).toContain("decoding request");
  });

  it("does not increment the counter on failure", () => {
    handlers.handleSayHello(jsonMsg({ name: "" }));
    const r = handlers.handleSayHello(jsonMsg({ name: "A" }));
    expect(parseData(r).greetingNumber).toBe(1);
  });
});

describe("handleSayGoodbye", () => {
  it("decodes the ABI payload and returns a farewell", () => {
    const r = handlers.handleSayGoodbye(goodbyeMsg("World", "done"));
    expect([r[1], r[2]]).toEqual([1, null]);
    expect(parseData(r)).toEqual({
      farewell: "Goodbye, World! Reason: done",
      farewellNumber: 1,
    });
  });

  it("keeps its counter independent of greetings", () => {
    handlers.handleSayHello(jsonMsg({ name: "A" }));
    const r = handlers.handleSayGoodbye(goodbyeMsg("B", "r"));
    expect(parseData(r).farewellNumber).toBe(1);
  });

  it("rejects an empty name", () => {
    const r = handlers.handleSayGoodbye(goodbyeMsg("", "r"));
    expect(r[1]).toBe(0);
    expect(r[2]).toContain("name must not be empty");
  });

  it("allows an empty reason, matching Go which validates name only", () => {
    const r = handlers.handleSayGoodbye(goodbyeMsg("W", ""));
    expect(r[1]).toBe(1);
    expect(parseData(r).farewell).toBe("Goodbye, W! Reason: ");
  });

  it("rejects a JSON payload — this operation is ABI-encoded", () => {
    const r = handlers.handleSayGoodbye(jsonMsg({ name: "W" }));
    expect(r[1]).toBe(0);
    expect(r[2]).toContain("decoding request");
  });
});

describe("reportState", () => {
  it("starts empty", () => {
    expect(handlers.reportState()).toEqual({
      greetingCount: 0,
      lastGreeting: "",
      farewellCount: 0,
      lastFarewell: "",
      fassetsAgentSolvencyEvaluations: 0,
      lastFassetsAgentSolvencyTier: "",
      consumerCreditEvaluations: 0,
      lastConsumerCreditTier: "",
    });
  });

  it("tracks both greeting operations", () => {
    handlers.handleSayHello(jsonMsg({ name: "A" }));
    handlers.handleSayGoodbye(goodbyeMsg("B", "r"));
    const state = handlers.reportState() as Record<string, unknown>;
    expect(state.greetingCount).toBe(1);
    expect(state.lastGreeting).toBe("Hello, A! Welcome to Flare Confidential Compute.");
    expect(state.farewellCount).toBe(1);
    expect(state.lastFarewell).toBe("Goodbye, B! Reason: r");
  });
});

function fassetsMsg(overrides: Record<string, unknown> = {}) {
  return jsonMsg({
    agentVault: AGENT_VAULT,
    onChainCollateralRatioBips: 15000, // 150%
    mintedFAssetValueUsd: "1000",
    fdcAttestedXrplReserveXrp: "200",
    ftsoXrpUsdPrice: "0.5", // -> 100 USD verified reserve
    privateSupplementaryReserveUsd: "50",
    privateUndisclosedLiabilitiesUsd: "10",
    ...overrides,
  });
}

describe("handleEvaluateFassetsAgentSolvency", () => {
  it("passes and returns a well-formed ABI-encoded attestation", () => {
    // onChainCollateralUsd = 1.5 * 1000 = 1500
    // fdcAttestedXrplReserveUsd = 200 * 0.5 = 100
    // compositeReserveUsd = 1500 + 100 + 50 = 1650
    // requiredReserveUsd = 1.5 * 1000 = 1500 -> ratio = 1.1 -> tier C
    // maxLiabilitiesUsd = 0.1 * 1650 = 165, liabilities = 10 -> ok
    const r = handlers.handleEvaluateFassetsAgentSolvency(fassetsMsg());
    expect([r[1], r[2]]).toEqual([1, null]);

    const decoded = decodeAttestation(r);
    expect(bytes32ToAscii(decoded.policyId)).toBe("fassets-agent-solvency-v1");
    expect(decoded.subject.toLowerCase()).toBe(AGENT_VAULT.toLowerCase());
    expect(decoded.resultCode).toBe(1); // PASS
    expect(decoded.tier).toBe(1); // C
    expect(decoded.validUntil).toBeGreaterThan(0n);
    expect(decoded.inputCommitment).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("reaches tier A when reserves comfortably clear the requirement", () => {
    const r = handlers.handleEvaluateFassetsAgentSolvency(
      fassetsMsg({ privateSupplementaryReserveUsd: "1500" }),
    );
    // compositeReserveUsd = 1500 + 100 + 1500 = 3100, requiredReserveUsd = 1500 -> ratio ~2.07
    expect(decodeAttestation(r).tier).toBe(3); // A
  });

  it("fails when composite reserves fall short of 150% of minted value", () => {
    const r = handlers.handleEvaluateFassetsAgentSolvency(
      fassetsMsg({ onChainCollateralRatioBips: 5000, privateSupplementaryReserveUsd: "0" }),
    );
    const decoded = decodeAttestation(r);
    expect(decoded.resultCode).toBe(0); // FAIL
    expect(decoded.tier).toBe(0); // FAIL
  });

  it("fails when undisclosed liabilities exceed the cap even with ample reserves", () => {
    const r = handlers.handleEvaluateFassetsAgentSolvency(
      fassetsMsg({ privateSupplementaryReserveUsd: "1500", privateUndisclosedLiabilitiesUsd: "10000" }),
    );
    expect(decodeAttestation(r).resultCode).toBe(0);
  });

  it("never leaks the private numbers into the response — only their commitment hash", () => {
    const r = handlers.handleEvaluateFassetsAgentSolvency(fassetsMsg({ privateSupplementaryReserveUsd: "123456" }));
    const raw = (r[0] ?? "").toLowerCase();
    expect(raw).not.toContain(Buffer.from("123456").toString("hex"));
  });

  it("rejects an invalid agentVault", () => {
    const r = handlers.handleEvaluateFassetsAgentSolvency(fassetsMsg({ agentVault: "not-an-address" }));
    expect(r[1]).toBe(0);
    expect(r[2]).toContain("agentVault");
  });

  it("rejects a negative decimal field", () => {
    const r = handlers.handleEvaluateFassetsAgentSolvency(fassetsMsg({ mintedFAssetValueUsd: "-5" }));
    expect(r[1]).toBe(0);
    expect(r[2]).toContain("mintedFAssetValueUsd");
  });

  it("rejects unknown fields", () => {
    const r = handlers.handleEvaluateFassetsAgentSolvency(fassetsMsg({ extra: "x" }));
    expect(r[1]).toBe(0);
    expect(r[2]).toContain("unknown field");
  });

  it("tracks evaluation count and last tier in state", () => {
    handlers.handleEvaluateFassetsAgentSolvency(fassetsMsg());
    const state = handlers.reportState() as Record<string, unknown>;
    expect(state.fassetsAgentSolvencyEvaluations).toBe(1);
    expect(state.lastFassetsAgentSolvencyTier).toBe("C");
  });
});

function creditMsg(overrides: Record<string, unknown> = {}) {
  return jsonMsg({
    subject: SUBJECT,
    requestedCreditUsd: "1000",
    publicWalletBalanceUsd: "800",
    privateIncomeUsd: "2000",
    privateLiabilitiesUsd: "100",
    ...overrides,
  });
}

describe("handleEvaluateConsumerCredit", () => {
  it("passes when composite funds cover 120% of requested credit", () => {
    // compositeReserveUsd = 800 + 0.3*2000 = 1400, requiredReserveUsd = 1.2*1000 = 1200 -> ratio ~1.17 -> tier C
    // totalFunds = 2800, maxLiabilities = 0.4*2800 = 1120, liabilities = 100 -> ok
    const r = handlers.handleEvaluateConsumerCredit(creditMsg());
    const decoded = decodeAttestation(r);
    expect(bytes32ToAscii(decoded.policyId)).toBe("consumer-credit-line-v1");
    expect(decoded.subject.toLowerCase()).toBe(SUBJECT.toLowerCase());
    expect(decoded.resultCode).toBe(1);
    expect(decoded.tier).toBe(1); // C
  });

  it("fails when requested credit far exceeds available funds", () => {
    const r = handlers.handleEvaluateConsumerCredit(creditMsg({ requestedCreditUsd: "100000" }));
    expect(decodeAttestation(r).resultCode).toBe(0);
  });

  it("fails when liabilities exceed 40% of total funds", () => {
    const r = handlers.handleEvaluateConsumerCredit(creditMsg({ privateLiabilitiesUsd: "5000" }));
    expect(decodeAttestation(r).resultCode).toBe(0);
  });

  it("rejects a zero requested credit amount", () => {
    const r = handlers.handleEvaluateConsumerCredit(creditMsg({ requestedCreditUsd: "0" }));
    expect(r[1]).toBe(0);
    expect(r[2]).toContain("requestedCreditUsd");
  });

  it("rejects an invalid subject address", () => {
    const r = handlers.handleEvaluateConsumerCredit(creditMsg({ subject: "0xnotanaddress" }));
    expect(r[1]).toBe(0);
    expect(r[2]).toContain("subject");
  });

  it("keeps its evaluation counter independent of the FAssets policy", () => {
    handlers.handleEvaluateFassetsAgentSolvency(fassetsMsg());
    handlers.handleEvaluateConsumerCredit(creditMsg());
    const state = handlers.reportState() as Record<string, unknown>;
    expect(state.fassetsAgentSolvencyEvaluations).toBe(1);
    expect(state.consumerCreditEvaluations).toBe(1);
  });
});
