/**
 * ★ Configuration: version and operation identifiers.
 *
 * Mirrors go/internal/config/config.go. The op-type and op-command strings MUST
 * match the bytes32 constants in contracts/InstructionSender.sol exactly, or
 * actions fall through to "unsupported op type".
 */

export const VERSION = "0.1.0";

export const OP_TYPE_GREETING = "GREETING";
export const OP_COMMAND_SAY_HELLO = "SAY_HELLO";
export const OP_COMMAND_SAY_GOODBYE = "SAY_GOODBYE";

/** Confidential policy attestations — Solvra's real operations. */
export const OP_TYPE_ATTESTATION = "ATTESTATION";
export const OP_COMMAND_EVALUATE_FASSETS_AGENT_SOLVENCY = "EVALUATE_FASSETS_AGENT_SOLVENCY";
export const OP_COMMAND_EVALUATE_CONSUMER_CREDIT = "EVALUATE_CONSUMER_CREDIT";

export const POLICY_ID_FASSETS_AGENT_SOLVENCY = "fassets-agent-solvency-v1";
export const POLICY_ID_CONSUMER_CREDIT_LINE = "consumer-credit-line-v1";
