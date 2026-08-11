import Link from "next/link";

const DEPLOYMENTS = [
  {
    label: "SolvraInstructionSender",
    address: "0x4F9450A35778feabC5efb652b516d6243b24Bc6A",
  },
  {
    label: "PolicyRegistry",
    address: "0xba4D15A738c09464A38aBa91B77A562B11Cca7E2",
  },
  {
    label: "AttestationRegistry",
    address: "0x243Ae9874F790f4ffE5D2c18a0fF40c5a10040fb",
  },
];

const explorerUrl = (address: string) =>
  `https://coston2-explorer.flare.network/address/${address}`;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">
        Confidential Compute · Flare Summer Signal
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl">
        Prove a financial policy is satisfied. Reveal nothing that satisfies it.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-neutral-400">
        Solvra is a confidential attestation protocol on Flare. A FAssets agent
        or a wallet can prove it meets a collateral or credit policy, getting
        back <span className="text-neutral-200">PASS/FAIL plus a tier</span>,
        without ever publishing the reserves, income, or liabilities that made
        it pass.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/fassets"
          className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-emerald-400"
        >
          Try the flagship: FAssets Agent Solvency
        </Link>
        <Link
          href="/trust"
          className="rounded-lg border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-neutral-500"
        >
          How to verify this is real
        </Link>
      </div>

      <section className="mt-20">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          Why this needs Flare, specifically
        </h2>
        <p className="mt-3 max-w-2xl text-neutral-400">
          A FAssets agent&apos;s on-chain collateral ratio is already public,
          so re-publishing it privately would add nothing. Solvra&apos;s policy
          combines three tiers of input instead, and each one depends on a
          different piece of Flare infrastructure:
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              tier: "1 · Public on-chain",
              detail: "The agent's FAssets collateral ratio, read directly from AssetManagerFXRP.getAgentInfo().",
            },
            {
              tier: "2 · Public, FDC-verified",
              detail: "The agent's real XRPL reserve balance, converted to USD with a live FTSO XRP/USD price.",
            },
            {
              tier: "3 · Private, TEE-only",
              detail: "Supplementary reserves and undisclosed liabilities, computed inside a Flare Compute Extension. Never published, only their hash.",
            },
          ].map((item) => (
            <div key={item.tier} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
              <p className="text-sm font-medium text-emerald-400">{item.tier}</p>
              <p className="mt-2 text-sm text-neutral-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          Live on Coston2, not just a diagram
        </h2>
        <div className="mt-4 divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800">
          {DEPLOYMENTS.map((d) => (
            <a
              key={d.address}
              href={explorerUrl(d.address)}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col gap-1 bg-neutral-900/30 px-5 py-3 text-sm transition hover:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <span className="text-neutral-300">{d.label}</span>
              <span className="break-all font-mono text-xs text-neutral-500">{d.address}</span>
            </a>
          ))}
        </div>
        <p className="mt-3 text-sm text-neutral-500">
          Full deployment record with transaction hashes:{" "}
          <a
            className="text-emerald-400 hover:underline"
            href="https://github.com/angelraph/Solvra/blob/main/docs/deployments.md"
            target="_blank"
            rel="noreferrer"
          >
            docs/deployments.md
          </a>
        </p>
      </section>
    </div>
  );
}
