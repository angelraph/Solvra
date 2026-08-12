# Solvra — Deployments

## Frontend

Live: **https://solvra-angelraphs-projects.vercel.app**

Next.js app, all 6 pages (landing, `/fassets`, `/credit`, `/relying-party`,
`/trust`, `/developers`) reading real data from the Coston2 contracts below.
Wallet connection via wagmi's EIP-6963 multi-provider discovery (every
injected wallet extension shown as its own choice — MetaMask, Rabby, OKX
Wallet, etc.) — no WalletConnect, no RainbowKit.

## Coston2 (Flare testnet, chain ID 114)

Deployed 2026-08-11 via `extension/scripts/pre-build.sh` against Flare's live
`FlareTeeManager` diamond and `TeeExtensionRegistry`/`TeeMachineRegistry`
facets — not a fork, not a local simulation.

| Contract / value | Address / ID |
|---|---|
| `SolvraInstructionSender` | [`0x4F9450A35778feabC5efb652b516d6243b24Bc6A`](https://coston2-explorer.flare.network/address/0x4F9450A35778feabC5efb652b516d6243b24Bc6A) |
| Solvra Extension ID (on `TeeExtensionRegistry`) | `0x000000000000000000000000000000000000000000000000000000000001026b` |
| `PolicyRegistry` | [`0xba4D15A738c09464A38aBa91B77A562B11Cca7E2`](https://coston2-explorer.flare.network/address/0xba4D15A738c09464A38aBa91B77A562B11Cca7E2) |
| `AttestationRegistry` | [`0x243Ae9874F790f4ffE5D2c18a0fF40c5a10040fb`](https://coston2-explorer.flare.network/address/0x243Ae9874F790f4ffE5D2c18a0fF40c5a10040fb) |
| `FlareTeeManager` (Flare system contract, not ours) | `0x1a9C4A0f9D76c0b1D91d22E24E573a9b377618aE` |
| Deployer / initial owner (testnet-only key, no real value) | `0xB31A383FF83C274B11F7bF72e5007e9C44ED5adB` |

Verified independently after deployment by reading the live contract's
`OP_TYPE_ATTESTATION()` constant directly off-chain and confirming it returns
`"ATTESTATION"` (right-padded bytes32) — i.e. this isn't just "a transaction
succeeded," it's confirmed to be running Solvra's actual custom logic, not
scaffold boilerplate.

Both policies are registered and active on the live `PolicyRegistry`:

| Policy ID (bytes32-encoded ASCII) | Type | Tx hash |
|---|---|---|
| `fassets-agent-solvency-v1` | `FAssetsAgentSolvency` (0) | [`0xe8892d0c0b3b63b5ef35cc2e499d360935c08b1fc602a6cd75e5c7fbb053064a`](https://coston2-explorer.flare.network/tx/0xe8892d0c0b3b63b5ef35cc2e499d360935c08b1fc602a6cd75e5c7fbb053064a) |
| `consumer-credit-line-v1` | `ConsumerCreditLine` (1) | [`0x79026c730054413495048a31a9aef2e7c23ae274c4e763eaa436be6b5be15e56`](https://coston2-explorer.flare.network/tx/0x79026c730054413495048a31a9aef2e7c23ae274c4e763eaa436be6b5be15e56) |

`AttestationRegistry.trustedSigners` gets populated once `post-build.sh`'s
`register-tee` step completes (in progress — see below) and a real TEE
signer address exists, not before.

## The TEE workload — real GCP Confidential Space, not simulated

`solvra-tee` (`us-central1-b`) is a genuine Confidential Space VM running the
extension image with `MODE=0`. Its own attestation token, read straight off
the VM's serial console, confirms real hardware:

```
hwmodel:GCP_AMD_SEV  secboot:true  swname:CONFIDENTIAL_SPACE
```

This is not `SIMULATED_TEE=true` — the platform trap the scaffold warns about
(`codeHash` `0x194844cf…` meaning simulated) does not apply here.

**A real deployment bug found and fixed along the way**: the first image
build (`solvra:v0.1.0`) never actually wired up `CHAIN_ID` — it wasn't baked
into the image and wasn't in the Confidential Space launch-policy override
list, so the deployed node signed every response with no chain identity
bound to it. `tee-proxy` correctly rejected those signatures
(`verifying response signature: invalid signature`). Fixed in `v0.2.0` by
baking `CHAIN_ID=114` into `typescript/Dockerfile`'s image, deliberately kept
*out* of the override list — overriding the chain a signature is bound to at
launch time, with no re-attestation of the change, is exactly what that
allowlist exists to prevent.

## The indexer/proxy — self-hosted, not waiting on Flare support

`tee-proxy` reads `FlareSystemsManager`/`Relay`/`VoterRegistry` state
directly from an indexer database — Flare's own shared Coston2 indexer, or a
self-hosted equivalent. We asked Flare support for read access to the shared
one; it went unanswered long enough that we self-hosted instead, using
Flare's own `flare-system-c-chain-indexer` against a public Coston2 RPC. Both
run on `solvra-infra` (`us-central1-a`, internal IP `10.128.0.2`), fronted by
Caddy for automatic HTTPS with no owned domain
(`https://35-239-129-118.sslip.io`, via sslip.io's IP-in-hostname trick):

- `mysql` — the indexer's own database, credentials we control
- `indexer` — `flare-cchain-indexer`, `mode = "full"`, `start_index` set
  comfortably before the oldest reward epoch `tee-proxy` needs (its own
  `fsp`-mode cold-start bootstrap left an unindexed gap between its
  event-only backfill and where continuous indexing picked up — `full` mode
  with an explicit start avoids that gap entirely, at the cost of a one-time
  slower backfill)
- `redis` — the proxy's queue
- `ext-proxy` — `tee-proxy`, our own instance, not Flare's shared one
- `caddy` — TLS termination for the public endpoints

## What's left before an end-to-end round trip is proven

`allow-tee-version` and `set-governance` are both confirmed complete and
idempotent (re-run clean, no-ops on a second pass). The indexer's full-mode
backfill finished; `tee-proxy` stays synced, and the policy-consistency
preflight before every availability check reads from it and has passed
cleanly on every attempt.

**Currently blocked**: `register-tee`'s final step —
`RequestAvailabilityCheckAttestation` succeeds on-chain every time (most
recent: instruction `0xe58faba2214f7fee97a32428a3c758d65e85a7fccbc551829ad3082866af2eb7`),
but the result never lands on either of Coston2's FTDC proxies
(`tee-proxy-coston2-1.flare.rocks`, `-2.flare.rocks`) — both return 404
`response not in storage`, including on a fresh attempt confirmed clean for
a full 20 minutes (well past this system's normal timing per Flare's own
FCC troubleshooting notes). Ruled out directly, not assumed:

- Staleness — re-ran the whole flow fresh, same result.
- Wrong proxy — identical 404 on primary and fallback.
- Our own indexer/DB — the one step that reads it passes every time.
- Unreachable machine — registered URL (`https://35-239-129-118.sslip.io`)
  confirmed live, valid cert, both manually and via the tool's own preflight.

Escalated to Flare's FCC support channel with the specific instruction ID,
teeId, and dispatch details; waiting on a trace from their side. Machine
status is not yet PRODUCTION as a direct result — expected at this stage,
not a separate problem.

- `submitAttestation` against a real TEE-signed payload (the raw-hash
  signature-recovery assumption in `AttestationRegistry.sol` is verified only
  against a locally-crafted signature so far, via Foundry's `vm.sign` — see
  that contract's docstring).
- `scripts/test.sh` — the actual end-to-end round trip through the deployed
  extension.

This file gets a real proxy URL, `codeHash`, and TEE registration tx hash
filled in the moment those steps complete — not before.
