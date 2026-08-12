import Link from "next/link";
import { SignalSphereClient as SignalSphere } from "@/components/SignalSphereClient";

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

const explorerUrl = (address: string) => `https://coston2-explorer.flare.network/address/${address}`;

export default function HomePage() {
  return (
    <div>
      {/* ── Hero — dark, the sphere represents the product itself: many
          private signals, one verified answer. ── */}
      <section className="relative overflow-hidden border-b border-neutral-800 bg-shark">
        {/* One SignalSphere instance, repositioned by breakpoint rather than
            duplicated — mounting it twice (an in-flow copy for mobile plus
            the absolute desktop one) would open two WebGL contexts for the
            same visual, wasteful on exactly the devices least able to
            afford it. Below md it sits in normal flow, full width, above
            the headline; at md+ it becomes the absolute right-half panel
            behind the text. */}
        <div className="relative mb-2 h-64 w-full sm:h-80 md:absolute md:inset-y-0 md:right-0 md:mb-0 md:h-auto md:w-1/2">
          <SignalSphere />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blush">
            Confidential Compute · Flare Summer Signal
          </p>
          <h1 className="mt-6 max-w-2xl font-heading text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
            Prove a financial policy is satisfied.
            <span className="block text-amaranth">Reveal nothing.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg text-neutral-400">
            Solvra is a confidential attestation protocol on Flare. A FAssets agent or a wallet
            proves it meets a collateral or credit policy, getting back PASS/FAIL plus a tier,
            without ever publishing the reserves, income, or liabilities that made it pass.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/fassets"
              className="rounded-lg bg-amaranth px-6 py-3 text-sm font-semibold text-white transition hover:bg-blush"
            >
              Try the flagship: FAssets Agent Solvency
            </Link>
            <Link
              href="/trust"
              className="rounded-lg border border-neutral-700 px-6 py-3 text-sm font-semibold text-neutral-200 transition hover:border-neutral-500"
            >
              How to verify this is real
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 2 — light, the mechanism in plain terms. ── */}
      <section className="bg-neutral-50 py-24 text-neutral-900">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
            Your lender needs an answer.
            <br />
            <span className="text-neutral-500">They don&apos;t need your entire financial history.</span>
          </h2>

          <div className="mt-14 grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Private input</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Portfolio</dt>
                  <dd className="font-mono font-medium">$24,821</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Liquidity</dt>
                  <dd className="font-mono font-medium">$8,420</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Debt ratio</dt>
                  <dd className="font-mono font-medium">27%</dd>
                </div>
              </dl>
            </div>

            <div className="flex justify-center text-neutral-300 sm:rotate-0">
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="rotate-90 text-amaranth sm:rotate-0">
                <path d="M0 12H36M36 12L26 2M36 12L26 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="rounded-2xl border border-amaranth/20 bg-shark p-6 text-white shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-blush">Public result</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-lg font-bold text-emerald-400">✓ Eligible</span>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-400">Risk tier</dt>
                  <dd className="font-mono font-medium">A</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-400">Maximum credit</dt>
                  <dd className="font-mono font-medium text-blush">$7,820</dd>
                </div>
              </dl>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-neutral-500">
            The numbers on the left never leave the confidential compute layer. Only the card on the right gets published.
          </p>
        </div>
      </section>

      {/* ── Section 3 — dark, the three tiers, real and technical. ── */}
      <section className="bg-shark py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            Why this needs Flare, specifically
          </h2>
          <p className="mt-4 max-w-2xl text-neutral-400">
            A FAssets agent&apos;s on-chain collateral ratio is already public, so re-publishing it
            privately would add nothing. Solvra&apos;s policy combines three tiers of input instead,
            and each one depends on a different piece of Flare infrastructure:
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
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
              <div key={item.tier} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
                <p className="text-sm font-semibold text-blush">{item.tier}</p>
                <p className="mt-3 text-sm text-neutral-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4 — light, the live proof. ── */}
      <section className="bg-neutral-50 py-24 text-neutral-900">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">Live on Coston2, not just a diagram</h2>
          <div className="mt-8 divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {DEPLOYMENTS.map((d) => (
              <a
                key={d.address}
                href={explorerUrl(d.address)}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-1 px-6 py-4 text-sm transition hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="font-medium text-neutral-800">{d.label}</span>
                <span className="break-all font-mono text-xs text-neutral-500">{d.address}</span>
              </a>
            ))}
          </div>
          <p className="mt-4 text-sm text-neutral-500">
            Full deployment record with transaction hashes:{" "}
            <a
              className="font-medium text-amaranth hover:underline"
              href="https://github.com/angelraph/Solvra/blob/main/docs/deployments.md"
              target="_blank"
              rel="noreferrer"
            >
              docs/deployments.md
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
