/** Solvra's shared policy engine — the "same engine, different policy" core. */

import { describe, expect, it } from "vitest";

import { evaluateReserveAdequacyPolicy, tierFromRatio, validUntilFromNow } from "../app/policyEngine.js";

describe("tierFromRatio", () => {
  it("assigns A at 2.0x and above", () => {
    expect(tierFromRatio(2.0)).toBe("A");
    expect(tierFromRatio(3.5)).toBe("A");
  });

  it("assigns B between 1.5x and 2.0x", () => {
    expect(tierFromRatio(1.5)).toBe("B");
    expect(tierFromRatio(1.99)).toBe("B");
  });

  it("assigns C between 1.0x and 1.5x", () => {
    expect(tierFromRatio(1.0)).toBe("C");
    expect(tierFromRatio(1.49)).toBe("C");
  });

  it("assigns FAIL below 1.0x", () => {
    expect(tierFromRatio(0.99)).toBe("FAIL");
    expect(tierFromRatio(0)).toBe("FAIL");
  });
});

describe("evaluateReserveAdequacyPolicy", () => {
  it("passes with tier A when reserves comfortably exceed the requirement", () => {
    const r = evaluateReserveAdequacyPolicy({
      policyId: "test",
      compositeReserveUsd: 2000,
      requiredReserveUsd: 1000,
      liabilitiesUsd: 50,
      maxLiabilitiesUsd: 100,
    });
    expect(r.outcome).toBe("PASS");
    expect(r.tier).toBe("A");
    expect(r.reserveRatio).toBe(2.0);
    expect(r.liabilitiesOk).toBe(true);
  });

  it("fails when the composite reserve is short of the requirement, even if liabilities are fine", () => {
    const r = evaluateReserveAdequacyPolicy({
      policyId: "test",
      compositeReserveUsd: 900,
      requiredReserveUsd: 1000,
      liabilitiesUsd: 0,
      maxLiabilitiesUsd: 1000,
    });
    expect(r.outcome).toBe("FAIL");
    expect(r.tier).toBe("FAIL");
  });

  it("fails when liabilities exceed the cap, even if reserves are ample", () => {
    const r = evaluateReserveAdequacyPolicy({
      policyId: "test",
      compositeReserveUsd: 5000,
      requiredReserveUsd: 1000,
      liabilitiesUsd: 200,
      maxLiabilitiesUsd: 100,
    });
    expect(r.outcome).toBe("FAIL");
    expect(r.tier).toBe("FAIL");
    expect(r.liabilitiesOk).toBe(false);
  });

  it("treats a zero requirement as automatically satisfied on the reserve side", () => {
    const r = evaluateReserveAdequacyPolicy({
      policyId: "test",
      compositeReserveUsd: 0,
      requiredReserveUsd: 0,
      liabilitiesUsd: 0,
      maxLiabilitiesUsd: 0,
    });
    expect(r.reserveRatio).toBe(Number.POSITIVE_INFINITY);
    expect(r.outcome).toBe("PASS");
    expect(r.tier).toBe("A");
  });
});

describe("validUntilFromNow", () => {
  it("adds exactly 24 hours to the given timestamp", () => {
    expect(validUntilFromNow(1_000_000)).toBe(BigInt(1_000_000 + 86400));
  });
});
