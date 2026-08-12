# Solvra

**Prove solvency. Reveal nothing.**

Solvra is a confidential attestation protocol on Flare. A FAssets agent or a
wallet can prove it satisfies a financial policy — a collateral requirement,
a credit-eligibility check — and get back a verifiable **PASS/FAIL plus a
tier**, without ever publishing the reserves, income, or liabilities that
made it pass.

Built for Flare's **Summer Signal** hackathon (DoraHacks), targeting both the
Interoperable Asset Products and Confidential Compute Apps bounties.

- **Live app:** https://solvra-angelraphs-projects.vercel.app
- **Deployed contracts & tx hashes:** [`docs/deployments.md`](docs/deployments.md)

## The problem

A FAssets agent's on-chain collateral ratio is already public. If an
attestation protocol just re-published that same number privately, it would
add nothing. The interesting problem is different: an agent, or a wallet,
usually has *more* financial context than what's on-chain — other reserves,
other liabilities, private arrangements — and today there's no way to prove
that fuller picture satisfies someone else's policy without just handing
over the raw numbers.

Solvra's flagship policy — **FAssets agent solvency** — combines three tiers
of input, and only the last one is private:

1. **Public, on-chain** — the agent's real FAssets collateral ratio, read
   directly from `AssetManagerFXRP.getAgentInfo()`.
2. **Public, FDC-verified** — the agent's real XRPL reserve balance,
   converted to USD with a live FTSO XRP/USD price.
3. **Private, TEE-only** — supplementary reserves and undisclosed
   liabilities, evaluated inside a Flare Compute Extension and never
   published. Only a keccak256 commitment to them is.

A second policy — **consumer credit-line eligibility** — runs on the exact
same engine with different (still real) inputs, which is the point: Solvra
is a general "prove a policy without revealing the data" protocol, not a
single-purpose lending app.

## Why this needs Flare specifically

- **Flare Compute Extensions (FCC)** — the confidential-compute layer.
  Solvra's policy engine runs as a real Flare Compute Extension, registered
  through Flare's own `TeeExtensionRegistry`/`TeeMachineRegistry`
  (`FlareTeeManager`), not a custom substitute.
- **FTSO** — live XRP/USD and FLR/USD prices, read on every page load.
- **FDC** — intended path for verifying an agent's real XRPL reserve balance
  (see [What's not finished](#whats-not-finished) — this specific piece
  isn't wired into the frontend yet, stated plainly rather than faked).
- **FAssets** — the flagship policy exists specifically to serve FAssets
  agents, minters, and anyone relying on FXRP's collateral health.

## Architecture

```
                         ┌─────────────────────────┐
   User / Agent          │   Coston2 (Flare L1)     │
   ───────────           │                          │
   connects wallet   ───▶│  SolvraInstructionSender │
   sends an              │         │                │
   instruction            │         ▼                │
                          │  TeeExtensionRegistry /  │
                          │  TeeMachineRegistry      │
                          │  (Flare's own system     │
                          │   contracts)             │
                          └─────────┬────────────────┘
                                    │ relays instruction
                                    ▼
                     ┌───────────────────────────────┐
                     │  Solvra's Flare Compute        │
                     │  Extension (TypeScript)        │
                     │                                │
                     │  policyEngine.ts — one shared   │
                     │  evaluateReserveAdequacyPolicy  │
                     │  core, two policies:            │
                     │   • fassets-agent-solvency-v1  │
                     │   • consumer-credit-line-v1     │
                     │                                │
                     │  Computes PASS/FAIL + tier,     │
                     │  signs it, never emits the      │
                     │  private inputs — only their    │
                     │  keccak256 commitment.          │
                     └─────────┬───────────────────────┘
                               │ signed result
                               ▼
                  ┌─────────────────────────────┐
                  │  AttestationRegistry.sol     │
                  │  ecrecover-verifies the      │
                  │  signer, stores the verdict  │
                  └─────────┬─────────────────────┘
                            │ isValid(subject, policyId)
                            ▼
                   Relying party (lender, insurer,
                   governance dashboard) — reads
                   PASS/FAIL + tier, nothing else.
```

## What's real, and what's not finished

Solvra's build standard: **nothing shipped is mocked.** Where a real gap
exists, it's stated plainly in the UI and docs rather than faked. Full,
current breakdown lives on the live app's [Trust Center](https://solvra-angelraphs-projects.vercel.app/trust) —
short version:

**Real and live:**
- `SolvraInstructionSender`, `PolicyRegistry`, `AttestationRegistry` — all
  deployed and independently verifiable on Coston2.
- Registered as a real Flare Compute Extension through Flare's own registry
  contracts, not a custom stand-in.
- 108 tests across the TEE extension (78) and contracts (30 combined).
- Every FAssets/FTSO number on `/fassets` and `/credit` is read live from
  Coston2 on page load — not cached, not hardcoded.

**What's not finished:**
- FDC-verified XRPL reserve balance — currently a manual input field on
  `/fassets` with an explicit on-screen note; the real Web2Json request/poll
  flow isn't wired into the frontend yet.
- A live TEE round-trip (sending an instruction and getting a signed result
  back) hasn't been observed end-to-end yet — it needs Solvra's extension
  proxy running publicly, which needs indexer DB credentials from Flare
  support (requested, pending).
- Real hardware attestation via Google Cloud Confidential Space — everything
  today runs with `SIMULATED_TEE=true`.

## Repo structure

```
extension/          Flare's official fce-extension-scaffold, renamed to Solvra
  contracts/         SolvraInstructionSender.sol, PolicyRegistry.sol, AttestationRegistry.sol
  typescript/         The TEE extension: policyEngine.ts, handlers.ts, abi.ts
  test/               Foundry tests for the contracts
frontend/            Next.js app — landing, /fassets, /credit, /relying-party, /trust, /developers
docs/                deployments.md and this file
```

## Running it locally

```bash
# Contracts
cd extension
forge test

# TEE extension
cd extension/typescript
npm install && npm test

# Frontend
cd frontend
npm install && npm run dev
```

## Roadmap

- Wire the real FDC `Web2Json` request/poll flow into `/fassets`.
- Get the extension proxy running publicly and observe a real signed
  TEE result end-to-end.
- Deploy to a real Google Cloud Confidential Space VM.
- Replace `AttestationRegistry`'s owner-gated `trustedSigners` allowlist
  with a direct on-chain read against Flare's `TeeMachineRegistry`, once
  that's exposed for external contracts to query.
- Register Solvra's own FAssets agent vault, so the flagship demo no longer
  depends on reading a third party's public data.
- Additional policy types beyond the two shipped here.
