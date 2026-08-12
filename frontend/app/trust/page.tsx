"use client";

import { CONTRACTS, POLICY_IDS } from "@/lib/contracts";
import { stringToBytes32 } from "@/lib/bytes32";
import { usePolicy } from "@/lib/hooks";

const explorerAddr = (addr: string) => `https://coston2-explorer.flare.network/address/${addr}`;

interface PolicyStruct {
  owner: `0x${string}`;
  name: string;
  metadataURI: string;
  rulesetHash: `0x${string}`;
  policyType: number;
  active: boolean;
  createdAt: bigint;
}

function PolicyCard({ policyId }: { policyId: string }) {
  const query = usePolicy(stringToBytes32(policyId));
  const p = query.data as PolicyStruct | undefined;

  return (
    <div className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="break-all font-mono text-sm text-neutral-300">{policyId}</p>
        {p && (
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
              p.active ? "bg-amaranth/15 text-blush" : "bg-red-950 text-red-400"
            }`}
          >
            {p.active ? "active" : "inactive"}
          </span>
        )}
      </div>
      {query.isLoading && <p className="mt-3 text-sm text-neutral-500">Reading live from PolicyRegistry…</p>}
      {p && (
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Name" value={p.name} />
          <Row label="Owner" value={p.owner} mono />
          <Row label="Ruleset commitment" value={p.rulesetHash} mono />
          <Row
            label="Rules source"
            value={p.metadataURI}
            href={p.metadataURI}
          />
          <Row label="Registered" value={new Date(Number(p.createdAt) * 1000).toLocaleString()} />
        </dl>
      )}
    </div>
  );
}

function Row({ label, value, mono, href }: { label: string; value: string; mono?: boolean; href?: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className={`min-w-0 break-all text-neutral-200 ${mono ? "font-mono text-xs" : ""}`}>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="break-all text-blush hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export default function TrustPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-blush">Trust Center</p>
      <h1 className="mt-3 font-heading text-4xl font-black tracking-tight text-white sm:text-5xl">
        What&apos;s real, what&apos;s pending
      </h1>
      <p className="mt-4 text-lg text-neutral-400">
        Per the hackathon&apos;s own checklist: be clear about what is real, mocked, trusted, or still incomplete. No
        part of Solvra tries to look more finished than it is.
      </p>

      <section className="mt-10 space-y-3">
        <StatusRow
          ok
          title="Contracts deployed and live on Coston2"
          detail="SolvraInstructionSender, PolicyRegistry, AttestationRegistry: all independently verifiable on-chain."
        />
        <StatusRow
          ok
          title="Extension registered as a real Flare Compute Extension"
          detail="Registered through Flare's own TeeExtensionRegistry/TeeMachineRegistry (the FlareTeeManager diamond), not a custom substitute."
        />
        <StatusRow
          ok
          title="Policy logic: written, tested, on-chain"
          detail="108 tests total across the TEE extension (78) and contracts (30 combined): reserve math, tiering, validation, and a real ECDSA signature round-trip."
        />
        <StatusRow
          ok
          title="Public + FTSO-priced data: genuinely live"
          detail="FAssets agent collateral, FXRP minted amounts, XRP/USD and FLR/USD prices are read directly from Coston2 on every page load. Not cached, not hardcoded."
        />
        <StatusRow
          ok
          title="Real hardware attestation: live on Google Cloud Confidential Space"
          detail="MODE=0, not simulated. The running workload's own attestation is a Google-signed token confirming GCP_AMD_SEV hardware and a measured code hash, checkable directly against the proxy's /info endpoint."
        />
        <StatusRow
          ok
          title="TEE machine registered on-chain"
          detail="Pre-registration and attestation both confirmed via real transactions on Flare's TeeMachineRegistry, not a local simulation."
        />
        <StatusRow
          title="Final production promotion: pending Flare's own attestation round"
          detail="The last step submits an on-chain availability check that real Flare data providers must independently observe and answer, on Flare's own reward-epoch cadence. That's Flare's infrastructure timing, not something on our end to speed up."
        />
        <StatusRow
          title="FDC-verified XRPL reserve: manual input for now"
          detail="The live Web2Json request/poll flow (roughly 90 to 180 seconds) isn't wired into the frontend yet. The /fassets page says so explicitly rather than faking it."
        />
        <StatusRow
          title="A full signed verdict through the pipeline: not yet observed end-to-end"
          detail="Sending an instruction on-chain works today. The proxy relaying it to the TEE and back is self-hosted (Flare's own indexer access request went unanswered, so we built our own against a public Coston2 RPC) and confirmed correctly synced with Flare's live network state. The last piece is the production promotion above."
        />
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">The trust model, precisely</h2>
        <p className="mt-3 text-neutral-400">
          <code className="text-neutral-200">AttestationRegistry.submitAttestation</code> recovers the TEE&apos;s signer
          via <code className="text-neutral-200">ecrecover</code> and checks it against an owner-gated{" "}
          <code className="text-neutral-200">trustedSigners</code> allowlist. Today, trusting a signer means trusting
          that the contract owner independently verified a real TEE attestation off-chain before adding it. That is
          the exact seam Flare&apos;s own FCC protocol closes over time. Once relying parties can query Flare&apos;s
          <code className="text-neutral-200"> TeeMachineRegistry</code> directly on-chain, that check replaces the
          allowlist entirely. The full source, with this reasoning written into the docstring, is on GitHub.
        </p>
        <a
          href={explorerAddr(CONTRACTS.attestationRegistry.address)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-blush hover:underline"
        >
          View AttestationRegistry on Coston2 Explorer →
        </a>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Registered policies, live</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <PolicyCard policyId={POLICY_IDS.fassetsAgentSolvency} />
          <PolicyCard policyId={POLICY_IDS.consumerCreditLine} />
        </div>
      </section>
    </div>
  );
}

function StatusRow({ ok, title, detail }: { ok?: boolean; title: string; detail: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
      <span className={`mt-0.5 text-lg ${ok ? "text-blush" : "text-amber-400"}`}>{ok ? "✓" : "○"}</span>
      <div>
        <p className="text-sm font-medium text-neutral-200">{title}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{detail}</p>
      </div>
    </div>
  );
}
