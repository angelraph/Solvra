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

const explorerUrl = (address: string) => `https://coston2-explorer.flare.network/address/${address}`;

const STEPS = [
  {
    number: "1",
    title: "You have private numbers",
    detail:
      "A FAssets agent's real treasury, or a wallet's real income and debts — information you have a good reason not to publish to the world.",
  },
  {
    number: "2",
    title: "Solvra checks them in a sealed environment",
    detail:
      "Your numbers go into a Flare Compute Extension — a secure enclave that runs the check but can't be inspected while it's running, not even by Solvra.",
  },
  {
    number: "3",
    title: "You get back a verdict, not your data",
    detail:
      "Pass or fail, plus a tier (A, B, or C). That's it. The actual numbers never leave the enclave — only their result, cryptographically signed.",
  },
  {
    number: "4",
    title: "Anyone can check the verdict is real",
    detail:
      "The signature is verifiable on-chain by anyone — a lender, a protocol, a curious stranger — without ever seeing what was behind it.",
  },
];

const NEXT_STEPS = [
  {
    audience: "I manage a FAssets agent",
    action: "Prove your agent is adequately collateralized",
    href: "/fassets",
    cta: "Try the flagship demo",
  },
  {
    audience: "I want to see this for personal credit",
    action: "Prove you qualify for a credit line without exposing your finances",
    href: "/credit",
    cta: "Try the credit demo",
  },
  {
    audience: "I'm building something that needs to check attestations",
    action: "See how a relying party reads a verdict on-chain",
    href: "/relying-party",
    cta: "See it in action",
  },
  {
    audience: "I want to make sure none of this is faked",
    action: "Every real vs. pending vs. simulated piece, listed honestly",
    href: "/trust",
    cta: "Check what's real",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ── Hero — dark, the sphere represents the product itself: many
          private signals, one verified answer. ── */}
      <section className="relative overflow-hidden border-b border-neutral-800 bg-shark">
        {/* The sphere itself now lives site-wide in app/layout.tsx
            (components/AmbientSphere.tsx) — fading in and out behind every
            page, not just this one. */}
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-300">
            Solvra
            <span className="text-neutral-600">·</span>
            <span className="text-blush">Built on Flare</span>
          </span>
          <h1 className="mt-6 max-w-2xl font-heading text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
            Prove you qualify.
            <span className="block text-amaranth">Without showing your numbers.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg text-neutral-400">
            Think of it like a background check that only ever says &ldquo;approved&rdquo; or
            &ldquo;not approved&rdquo; &mdash; never the private details it looked at to decide. Solvra lets a
            FAssets agent or a crypto wallet prove it meets a financial policy and get back
            PASS/FAIL plus a tier, without publishing the reserves, income, or liabilities that
            made it pass.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/fassets"
              className="rounded-lg bg-amaranth px-6 py-3 text-sm font-semibold text-white transition hover:bg-blush"
            >
              Try it now
            </Link>
            <a
              href="#how-it-works"
              className="rounded-lg border border-neutral-700 px-6 py-3 text-sm font-semibold text-neutral-200 transition hover:border-neutral-500"
            >
              Explain it to me first
            </a>
          </div>
        </div>
      </section>

      {/* ── Section: plain-language walkthrough for a first-time, ── */}
      {/* non-technical visitor. Numbered, no jargon left unexplained. ── */}
      <section id="how-it-works" className="bg-neutral-50 py-24 text-neutral-900">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amaranth">
            In plain English
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-4xl">
            How Solvra actually works
          </h2>
          <p className="mt-4 max-w-2xl text-neutral-600">
            No wallet needed to understand this part &mdash; just four steps.
          </p>

          <ol className="mt-12 space-y-8">
            {STEPS.map((step) => (
              <li key={step.number} className="flex gap-5">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-shark font-heading text-lg font-bold text-white">
                  {step.number}
                </span>
                <div>
                  <p className="font-heading text-lg font-bold text-neutral-900">{step.title}</p>
                  <p className="mt-1.5 text-neutral-600">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-16 grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                What you keep private
              </p>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-blush">
                What gets published
              </p>
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
            The card on the left never leaves the confidential compute layer. Only the card on
            the right gets published.
          </p>
        </div>
      </section>

      {/* ── Section: clear next step for every kind of visitor. ── */}
      <section className="bg-shark py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            What do you want to do?
          </h2>
          <p className="mt-3 max-w-2xl text-neutral-400">
            Pick the one that sounds like you &mdash; every page below is the live app, not a
            mockup.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {NEXT_STEPS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 transition hover:border-amaranth/50 hover:bg-neutral-900"
              >
                <p className="text-sm font-semibold text-blush">{item.audience}</p>
                <p className="mt-3 text-sm text-neutral-400">{item.action}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                  {item.cta}
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section: the three tiers, real and technical — for readers ── */}
      {/* who want to know exactly what Flare infrastructure does what. ── */}
      <section className="bg-neutral-50 py-24 text-neutral-900">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amaranth">
            For the technically curious
          </p>
          <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">
            Why this needs Flare, specifically
          </h2>
          <p className="mt-4 max-w-2xl text-neutral-600">
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
              <div key={item.tier} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-amaranth">{item.tier}</p>
                <p className="mt-3 text-sm text-neutral-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section: the live proof. ── */}
      <section className="bg-shark py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            Live on Coston2, not just a diagram
          </h2>
          <div className="mt-8 divide-y divide-neutral-800 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50">
            {DEPLOYMENTS.map((d) => (
              <a
                key={d.address}
                href={explorerUrl(d.address)}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-1 px-6 py-4 text-sm transition hover:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="font-medium text-neutral-200">{d.label}</span>
                <span className="break-all font-mono text-xs text-neutral-500">{d.address}</span>
              </a>
            ))}
          </div>
          <p className="mt-4 text-sm text-neutral-500">
            Full deployment record with transaction hashes:{" "}
            <a
              className="font-medium text-blush hover:underline"
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
