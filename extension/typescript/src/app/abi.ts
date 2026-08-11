/**
 * ★ ABI decoding for operations whose payload is ABI-encoded rather than JSON.
 *
 * SAY_GOODBYE's contract passes abi.encode((string name, string reason)),
 * matching SayGoodbyeMessageArg in go/pkg/types/types.go. SAY_HELLO uses plain
 * JSON and needs nothing here.
 *
 * ATTESTATION results (EVALUATE_FASSETS_AGENT_SOLVENCY / EVALUATE_CONSUMER_CREDIT)
 * are ABI-encoded on the way OUT instead: the request is JSON (simpler, and it
 * never needs on-chain decoding), but the response must be ABI-encoded because
 * Solvra's AttestationRegistry contract decodes it directly on-chain via
 * abi.decode(data, (bytes32,address,uint8,uint8,uint256,bytes32)).
 */

import { encodeAbiParameters, decodeAbiParameters, keccak256, toHex, type Hex } from "viem";

/** A single tuple argument, matching Solidity's abi.encode of a struct. */
const SAY_GOODBYE_PARAMS = [
  {
    type: "tuple",
    components: [
      { name: "name", type: "string" },
      { name: "reason", type: "string" },
    ],
  },
] as const;

export interface SayGoodbyeMessage {
  name: string;
  reason: string;
}

/**
 * Decode ABI-encoded (string name, string reason).
 * Throws if the payload does not match the expected layout.
 */
export function decodeSayGoodbye(data: Hex): SayGoodbyeMessage {
  try {
    const [decoded] = decodeAbiParameters(SAY_GOODBYE_PARAMS, data);
    return { name: decoded.name, reason: decoded.reason };
  } catch (e) {
    throw new Error(`ABI decode failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * Flat 6-field tuple matching Solidity's
 * abi.decode(data, (bytes32,address,uint8,uint8,uint256,bytes32)) —
 * six top-level params, NOT a single wrapped struct like SAY_GOODBYE above.
 */
const ATTESTATION_RESULT_PARAMS = [
  { name: "policyId", type: "bytes32" },
  { name: "subject", type: "address" },
  { name: "result", type: "uint8" },
  { name: "tier", type: "uint8" },
  { name: "validUntil", type: "uint256" },
  { name: "inputCommitment", type: "bytes32" },
] as const;

export interface AttestationResultPayload {
  policyId: Hex;
  subject: `0x${string}`;
  result: number;
  tier: number;
  validUntil: bigint;
  inputCommitment: Hex;
}

/** ABI-encode an attestation verdict for on-chain ecrecover + abi.decode. */
export function encodeAttestationResult(payload: AttestationResultPayload): Hex {
  return encodeAbiParameters(ATTESTATION_RESULT_PARAMS, [
    payload.policyId,
    payload.subject,
    payload.result,
    payload.tier,
    payload.validUntil,
    payload.inputCommitment,
  ]);
}

/**
 * Encode a short ASCII policy id as bytes32, right-padded with zero bytes —
 * the same convention InstructionSender.sol uses for OP_TYPE/OP_COMMAND, so
 * on-chain code can compare policy ids without ever hashing them.
 */
export function policyIdToBytes32(id: string): Hex {
  const bytes = new TextEncoder().encode(id);
  if (bytes.length > 32) {
    throw new Error(`policyId too long for bytes32 (${bytes.length} bytes): ${id}`);
  }
  const padded = new Uint8Array(32);
  padded.set(bytes);
  return toHex(padded);
}

/**
 * keccak256 over the canonical JSON encoding of the full private input
 * object. This is what lets Solvra publish "PASS, tier A" on-chain while the
 * actual numbers stay off-chain: anyone holding the original input JSON can
 * later recompute this hash and prove it matches what was attested, without
 * the chain ever storing the private figures themselves.
 */
export function commitInputs(input: Record<string, unknown>): Hex {
  const canonical = JSON.stringify(input, Object.keys(input).sort());
  return keccak256(toHex(canonical));
}
