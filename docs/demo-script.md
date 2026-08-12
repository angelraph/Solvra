# Demo script

Target: under 3 minutes. Every screen shown is the live app at
https://solvra-angelraphs-projects.vercel.app — nothing here is a mockup.

## 1. The problem, fast (15s)

> "A FAssets agent's collateral ratio is already public on-chain. But an
> agent usually has more financial context than that — other reserves,
> other liabilities. There's no way today to prove that fuller picture
> satisfies a policy without just handing over the raw numbers. That's
> what Solvra does: prove a policy is satisfied, reveal nothing else."

Show the landing page. Point at the three-tier breakdown (public on-chain /
FDC-verified / private TEE-only).

## 2. Why Flare (15s)

> "This only works because of three things Flare actually provides: FTSO
> for live pricing, FDC for verified external data, and Flare Compute
> Extensions for the confidential part. This isn't three separate
> integrations bolted together — the policy genuinely needs all three."

Scroll to the "Live on Coston2" section — click through to the explorer on
one contract to show it's real.

## 3. The flagship flow, end to end (60–90s)

Navigate to `/fassets`.

1. Connect wallet (MetaMask, Coston2).
2. Point out the "live" badges — collateral ratio, minted FXRP, XRPL
   address, XRP/USD price, minted value in USD. Mention these are read
   directly from Coston2 on this exact page load, not hardcoded — and if
   time allows, refresh once to show the price ticking.
3. Point at the amber FDC section — say plainly: "This is meant to be
   FDC-verified automatically; that live request/poll flow isn't wired
   into the frontend yet, so it's a manual field for now. Saying that
   directly instead of hiding it."
4. Fill in the private fields (supplementary reserves, undisclosed
   liabilities) — point out the label: never published, only their hash.
5. Show the local policy preview (PASS/tier).
6. Click "Request Attestation On-Chain" — confirm in wallet, show the real
   transaction hash and explorer link.
7. Say plainly what happens next: "The signed result comes back once
   Solvra's extension proxy is running — that infrastructure is still
   being connected, so no verdict renders here yet. The instruction itself
   is real and on-chain."

## 4. The genericity proof (20s)

Navigate to `/credit`. Point out: same policy engine
(`evaluateReserveAdequacyPolicy`), same contracts, different inputs — this
time real wallet balance and a live FLR/USD price instead of FAssets data.
"This is the same protocol, not a second app."

## 5. The consumption side + honesty (20s)

Navigate to `/relying-party`. Paste an address, show the real
`AttestationRegistry.isValid()` read — "no valid attestation," genuinely,
because none has completed yet.

Navigate to `/trust`. Scroll through the real/pending checklist. Say:

> "This page exists because of the hackathon's own judging note — be clear
> about what's real, mocked, trusted, or incomplete. Everything here is
> checkable: contract addresses, transaction hashes, the actual trust
> model in the contract's own docstring."

## 6. Close (10s)

> "Solvra: prove solvency, reveal nothing. Live on Coston2, built specifically
> around what Flare provides, honest about what's left to finish."

## Things to double-check before recording

- [ ] Wallet has Coston2 selected and holds a small amount of C2FLR for gas.
- [ ] `/fassets` example agent still resolves (a real third-party agent —
      confirm it's still live via `docs/deployments.md`'s notes, or swap in
      Solvra's own agent if that's been registered by then).
- [ ] No console errors on any of the 6 pages.
- [ ] Record at a resolution where the "live" badges and explorer links are
      actually legible.
