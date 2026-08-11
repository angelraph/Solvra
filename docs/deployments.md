# Solvra — Deployments

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

`AttestationRegistry.trustedSigners` has no entries yet — that gets populated
once a real TEE signer address exists (after the extension proxy is running
and a signed result has been independently verified), not before.

## What's still local-only (not yet proven end-to-end on Coston2)

- Running instructions through the TEE and getting a signed result back
  (needs the extension proxy running publicly, which needs indexer DB
  credentials from Flare support — requested, not yet received).
- `submitAttestation` against a real TEE-signed payload (the raw-hash
  signature-recovery assumption in `AttestationRegistry.sol` is verified only
  against a locally-crafted signature so far, via Foundry's `vm.sign` — see
  that contract's docstring).
- Real hardware attestation (Google Cloud Confidential Space, `MODE=0`) —
  everything above runs with `SIMULATED_TEE=true` for now.
