"use client";

import { useState } from "react";
import { POLICY_IDS, CONTRACTS } from "@/lib/contracts";
import { stringToBytes32 } from "@/lib/bytes32";
import { useAttestationValidity } from "@/lib/hooks";

const POLICIES = [
  { id: POLICY_IDS.fassetsAgentSolvency, label: "FAssets Agent Solvency" },
  { id: POLICY_IDS.consumerCreditLine, label: "Consumer Credit Line" },
];

const explorerAddr = (addr: string) => `https://coston2-explorer.flare.network/address/${addr}`;

/** A toy relying party — anyone building on top of Solvra does exactly this:
 * one view call, no access to the underlying private data, ever. */
export default function RelyingPartyPage() {
  const [subject, setSubject] = useState("");
  const [policyId, setPolicyId] = useState<string>(POLICY_IDS.fassetsAgentSolvency);

  const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(subject);
  const policyBytes32 = stringToBytes32(policyId);
  const validity = useAttestationValidity(isValidAddress ? (subject as `0x${string}`) : undefined, policyBytes32);

  const data = validity.data as readonly [boolean, number, bigint] | undefined;
  const [passed, tier, validUntil] = data ?? [undefined, undefined, undefined];
  const tierLabel = tier === 3 ? "A" : tier === 2 ? "B" : tier === 1 ? "C" : "unknown";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-blush">Consumption side</p>
      <h1 className="mt-2 text-3xl font-semibold text-neutral-50">Relying Party Gate</h1>
      <p className="mt-3 text-neutral-400">
        This is what a lender, insurer, or governance dashboard does with Solvra: one read call against{" "}
        <a href={explorerAddr(CONTRACTS.attestationRegistry.address)} target="_blank" rel="noreferrer" className="text-blush hover:underline">
          AttestationRegistry
        </a>
        .isValid(subject, policyId). Nothing else. No access to the private inputs that produced the answer.
      </p>

      <section className="mt-10 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
        <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Subject address</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value.trim())}
          placeholder="0x…"
          className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm text-neutral-100 focus:border-amaranth focus:outline-none"
        />

        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-neutral-500">Policy</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {POLICIES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPolicyId(p.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                policyId === p.id
                  ? "border-amaranth bg-amaranth/15 text-blush"
                  : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {isValidAddress && (
        <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
          {validity.isLoading && <p className="text-sm text-neutral-500">Reading live from Coston2…</p>}
          {data && (
            <>
              <div className="flex items-baseline gap-3">
                <span className={`text-2xl font-semibold ${passed ? "text-blush" : "text-neutral-500"}`}>
                  {passed ? "ACCESS GRANTED" : "NO VALID ATTESTATION"}
                </span>
              </div>
              {passed && (
                <p className="mt-2 text-sm text-neutral-400">
                  Tier {tierLabel} · valid until{" "}
                  {validUntil ? new Date(Number(validUntil) * 1000).toLocaleString() : "unknown expiry"}
                </p>
              )}
              {!passed && (
                <p className="mt-2 text-sm text-neutral-500">
                  Either this subject has never submitted an attestation for this policy, the result was FAIL, or it
                  expired. Nothing here is mocked. It&apos;s a real, empty read.
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
