import { toHex, type Hex } from "viem";

/**
 * Right-pads an ASCII string into bytes32 hex — the same convention used for
 * Solidity's bytes32("...") literals and Solvra's OP_TYPE/OP_COMMAND/policyId
 * encoding (see extension/typescript/src/app/abi.ts:policyIdToBytes32).
 */
export function stringToBytes32(value: string): Hex {
  const bytes = new TextEncoder().encode(value);
  if (bytes.length > 32) {
    throw new Error(`Value too long for bytes32 (${bytes.length} bytes): ${value}`);
  }
  const padded = new Uint8Array(32);
  padded.set(bytes);
  return toHex(padded);
}
