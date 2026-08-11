# Architecture

## Layers

### 1. On-chain: three contracts, deliberately not reimplementing Flare's own infrastructure

- **`PolicyRegistry.sol`** — pure metadata. A policy is `{owner, name,
  metadataURI, rulesetHash, policyType, active, createdAt}`, keyed by a
  bytes32 policy id (ASCII, right-padded — the same convention used for
  `OP_TYPE`/`OP_COMMAND` throughout the FCE scaffold). `rulesetHash` is a
  keccak256 commitment to the exact rule logic the TEE evaluates for that
  policy — a way to confirm which version of the rules produced a given
  attestation, without putting the rules themselves on-chain.

- **`SolvraInstructionSender.sol`** (in `extension/contracts/InstructionSender.sol`,
  built from Flare's own `fce-extension-scaffold`) — the on-chain entry
  point into the TEE. `sendEvaluateFassetsAgentSolvency` and
  `sendEvaluateConsumerCredit` each package a JSON payload and call
  Flare's `TeeExtensionRegistry.sendInstructions`, which routes it to a
  registered TEE machine.

- **`AttestationRegistry.sol`** — stores `subject → policyId → verdict`,
  where a verdict is `{result, tier, validUntil, issuedBlock,
  enclaveSigner, inputCommitment}`. `submitAttestation` recovers the
  signer via `ecrecover` and checks an owner-gated `trustedSigners`
  allowlist (see `SECURITY.md` for exactly what that does and doesn't
  guarantee today). `isValid(subject, policyId)` is the one function
  relying parties call — it returns `(bool passed, uint8 tier, uint256
  validUntil)` and nothing else.

### 2. The TEE extension — one policy engine, two policies

`extension/typescript/src/app/`:

- **`policyEngine.ts`** — `evaluateReserveAdequacyPolicy(input)` is the
  entire shared core: given a composite reserve, a required reserve,
  liabilities, and a liabilities cap, it returns `PASS`/`FAIL` and a tier
  (`A` ≥ 2.0x headroom, `B` ≥ 1.5x, `C` ≥ 1.0x, else `FAIL`). Neither
  policy below reimplements this logic — they only compute their own
  policy-specific inputs and call in.

- **`handlers.ts`** — `handleEvaluateFassetsAgentSolvency` and
  `handleEvaluateConsumerCredit`, each following the FCE scaffold's
  4-step handler pattern (decode → validate → execute → respond). Every
  field is validated (address format, non-negative decimal parsing,
  unknown-field rejection matching the scaffold's `DisallowUnknownFields`
  convention) before it reaches the policy engine.

- **`abi.ts`** — `encodeAttestationResult` ABI-encodes the response as
  `(bytes32 policyId, address subject, uint8 result, uint8 tier, uint256
  validUntil, bytes32 inputCommitment)` — a flat 6-field tuple, matching
  what `AttestationRegistry.submitAttestation` expects to `abi.decode`.
  `commitInputs` computes the keccak256 commitment over the full private
  input object using a canonical (sorted-key) JSON encoding, so the same
  input always commits to the same hash regardless of field order.

Request payloads are plain JSON (matching the scaffold's `SAY_HELLO`
convention); response payloads are ABI-encoded (matching `SAY_GOODBYE`'s
convention) specifically because the response needs to be decoded
on-chain by `AttestationRegistry`, and Solidity has no JSON parser.

### 3. The FAssets agent solvency policy, concretely

Given (see `README.md` for which tier each field belongs to):

```
onChainCollateralUsd    = (onChainCollateralRatioBips / 10000) * mintedFAssetValueUsd
fdcAttestedXrplReserveUsd = fdcAttestedXrplReserveXrp * ftsoXrpUsdPrice
compositeReserveUsd     = onChainCollateralUsd + fdcAttestedXrplReserveUsd + privateSupplementaryReserveUsd
requiredReserveUsd      = 1.5 * mintedFAssetValueUsd
maxLiabilitiesUsd       = 0.10 * compositeReserveUsd
```

The policy passes if `compositeReserveUsd >= requiredReserveUsd` **and**
`privateUndisclosedLiabilitiesUsd <= maxLiabilitiesUsd`.

The consumer-credit policy is the same shape with `publicWalletBalanceUsd`
and a 30%-weighted `privateIncomeUsd` standing in for the reserve side, and
`requestedCreditUsd * 1.2` as the requirement — see
`extension/typescript/src/app/handlers.ts` for the exact constants.

### 4. The frontend

Next.js App Router, wagmi + viem for chain reads/writes, no server-side
component talks to the TEE directly — every write goes through the user's
own connected wallet calling `SolvraInstructionSender` on Coston2. FAssets
and FTSO addresses are resolved once via Flare's `FlareContractRegistry`
(`getContractAddressByName`) and hardcoded as the resolved values in
`frontend/lib/contracts.ts`, with a comment noting how they were obtained —
the standard pattern Flare's own examples use, not a guess.

## Why JSON in, ABI out (and not the reverse)

An earlier design considered ABI-encoding the request too, for symmetry.
Rejected because: the request is only ever constructed and consumed
off-chain (the frontend builds it, the TEE handler parses it) — JSON is
simpler to get right and matches the scaffold's own convention for
multi-field payloads. The response, by contrast, must be decoded **on-chain**
by `AttestationRegistry`, where JSON isn't an option.

## Why one contract deployment serves two policy verticals

`PolicyRegistry` and `AttestationRegistry` are policy-agnostic by
construction — neither contract has any FAssets- or credit-specific logic.
The only thing that differs between the two live policies is the
`policyId` and the handler that computes its inputs. This is the concrete
mechanism behind the "same engine, different policy" claim, not just
framing: registering a third policy tomorrow needs a new TEE handler and a
`PolicyRegistry.registerPolicy` call, not new contracts.
