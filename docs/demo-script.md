# Demo script

Target: under 3 minutes. Every screen shown is the live app at
https://solvra-angelraphs-projects.vercel.app, nothing here is a mockup.

## 1. The problem, fast (15s)

> "A FAssets agent's collateral ratio is already public on-chain. But an
> agent usually has more financial context than that: other reserves,
> other liabilities. There's no way today to prove that fuller picture
> satisfies a policy without just handing over the raw numbers. That's
> what Solvra does: prove a policy is satisfied, reveal nothing else."

Show the landing page. Scroll through the plain-language "how it works" walkthrough,
then the three-tier breakdown (public on-chain / FDC-verified / private TEE-only).

## 2. Why Flare (15s)

> "This only works because of three things Flare actually provides: FTSO
> for live pricing, FDC for verified external data, and Flare Compute
> Extensions for the confidential part. This isn't three separate
> integrations bolted together, the policy genuinely needs all three."

Scroll to the "Live on Coston2" section, click through to the explorer on
one contract to show it's real.

## 3. Real hardware attestation, provably (20s)

This is the moment that separates Solvra from a diagram. Open a terminal
(or a browser tab) and run:

```
curl -s https://35-239-129-118.sslip.io/info | jq '.machineData'
```

> "This is our TEE extension running right now on Google Cloud Confidential
> Space. `platform` decodes to GCP_AMD_SEV, real hardware, not a
> simulation. The `attestation` field is a token signed by Google's own
> confidential computing service, verifiable independently of anything I
> say here."

If `docs/deployments.md`'s status says the TEE is fully promoted to
production by recording time, mention that too: "and this machine is
registered and active on Flare's own TeeMachineRegistry right now."

## 4. The flagship flow, end to end (60-90s)

Navigate to `/fassets`.

1. Connect wallet (MetaMask, Coston2).
2. Point out the "live" badges: collateral ratio, minted FXRP, XRPL
   address, XRP/USD price, minted value in USD. Mention these are read
   directly from Coston2 on this exact page load, not hardcoded, and if
   time allows, refresh once to show the price ticking.
3. Point at the amber FDC section, say plainly: "This is meant to be
   FDC-verified automatically; that live request/poll flow isn't wired
   into the frontend yet, so it's a manual field for now. Saying that
   directly instead of hiding it."
4. Fill in the private fields (supplementary reserves, undisclosed
   liabilities), point out the label: never published, only their hash.
5. Show the local policy preview (PASS/tier).
6. Click "Request Attestation On-Chain", confirm in wallet, show the real
   transaction hash and explorer link.
7. **Check `docs/deployments.md` right before recording** for which of these
   two is currently true, and say the accurate one:
   - If the TEE is fully promoted to production: the signed verdict should
     render on this page. Show it, and show `AttestationRegistry.isValid()`
     flipping to true on `/relying-party`.
   - If not yet: "The instruction itself is real and on-chain. The signed
     verdict comes back once Solvra's TEE machine finishes its final
     production promotion, an on-chain check that Flare's own data
     providers answer on Flare's own attestation-round timing, not
     something on our end to speed up."

## 5. The genericity proof (20s)

Navigate to `/credit`. Point out: same policy engine
(`evaluateReserveAdequacyPolicy`), same contracts, different inputs, this
time real wallet balance and a live FLR/USD price instead of FAssets data.
"This is the same protocol, not a second app."

## 6. The consumption side and honesty (20s)

Navigate to `/relying-party`. Paste an address, show the real
`AttestationRegistry.isValid()` read.

Navigate to `/trust`. Scroll through the real/pending checklist. Say:

> "This page exists because of the hackathon's own judging note: be clear
> about what's real, mocked, trusted, or incomplete. Everything here is
> checkable: contract addresses, transaction hashes, the actual trust
> model in the contract's own docstring."

## 7. Close (10s)

> "Solvra: prove solvency, reveal nothing. Live on Coston2, running on real
> Confidential Space hardware, built specifically around what Flare
> provides, honest about what's left to finish."

## Things to double-check before recording

- [ ] Wallet has Coston2 selected and holds a small amount of C2FLR for gas.
- [ ] `/fassets` example agent still resolves (a real third-party agent,
      confirm it's still live via `docs/deployments.md`'s notes, or swap in
      Solvra's own agent if that's been registered by then).
- [ ] Re-run the `curl .../info` command fresh, don't reuse an old screenshot.
- [ ] Check `docs/deployments.md` for current registration status and adjust
      step 4.7's wording accordingly.
- [ ] No console errors on any of the 6 pages.
- [ ] Record at a resolution where the "live" badges and explorer links are
      actually legible.
