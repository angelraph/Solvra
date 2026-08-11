# Security & Trust Model

This document states plainly what is and isn't trustless in Solvra today,
and what closes the gap.

## What `AttestationRegistry` actually verifies

`AttestationRegistry.submitAttestation` recovers the signer of a payload via
`ecrecover` over the raw `keccak256(data)` digest — matching Flare's
documented `ActionResult.Hash()` signing convention for Flare Compute
Extensions — and checks that recovered address against an owner-gated
`trustedSigners` allowlist. If the signer isn't on the allowlist, the
transaction reverts.

That signature-recovery logic is verified correct: `test/AttestationRegistry.t.sol`
includes a real round-trip using Foundry's `vm.sign` cheatcode, proving the
`ecrecover` math matches what a genuine ECDSA signature over that exact
payload shape produces. What is **not** yet independently verified is
whether Flare's real `tee-node` process signs with this exact convention in
production — that's confirmed against a locally-crafted signature so far,
not a live one.

## Where trust actually sits today

`trustedSigners` is an **owner-gated allowlist**. The contract owner adds an
address to it only after independently verifying — off-chain — that it's a
legitimately registered Solvra TEE machine (via Flare's `register-tee`
tooling and a real Confidential Space attestation document). Concretely,
today, trusting a Solvra attestation means trusting that the deployer
verified that attestation correctly before adding the signer.

This is stated as a real limitation, not hidden behind confident language.

## The seam this closes over

Flare's own Confidential Compute protocol already tracks which TEE machines
are legitimately registered for a given extension, in `TeeMachineRegistry`.
Once that registry exposes a way for external contracts to query "is this
address a currently-registered, currently-attested TEE machine for extension
X" directly on-chain, `AttestationRegistry` can replace the owner-gated
allowlist with that direct check — removing the deployer as a trust
intermediary entirely. That's the concrete migration path, not a vague
"eventually decentralize" gesture: the allowlist and the registry check are
structurally the same shape, one is just gated by an owner today and would
be gated by Flare's own protocol once available.

## What the private inputs actually protect against

Solvra's policy handlers (`extension/typescript/src/app/handlers.ts`) take
private numeric fields — supplementary reserves, undisclosed liabilities,
declared income — and never include them in the signed response payload.
Only a `keccak256` commitment over the full input object is published
(`commitInputs` in `extension/typescript/src/app/abi.ts`). This means:

- Anyone reading `AttestationRegistry` on-chain sees only `PASS/FAIL + tier`,
  never the numbers behind it.
- The subject who provided the private data can later prove exactly what
  they submitted by revealing the original input object and showing it
  hashes to the on-chain commitment — without anyone else being able to
  derive those numbers first.

This depends on the TEE's execution actually being confidential (i.e. that
the enclave, once real hardware attestation is in place, genuinely isolates
that computation from the host). Until Solvra is deployed on a real Google
Cloud Confidential Space VM, this property is architectural, not yet
hardware-enforced — see [`docs/deployments.md`](docs/deployments.md) for
current status.

## Reporting an issue

This is a hackathon submission on Coston2 testnet with no real funds at
risk. If you find a genuine logic issue in the contracts or extension,
open an issue on [the repo](https://github.com/angelraph/Solvra).
