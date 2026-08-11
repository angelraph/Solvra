// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { PolicyRegistry } from "./PolicyRegistry.sol";

/// @title AttestationRegistry
/// @author Solvra
/// @notice Stores and verifies the signed PASS/FAIL verdicts Solvra's TEE
/// extension produces for EVALUATE_FASSETS_AGENT_SOLVENCY and
/// EVALUATE_CONSUMER_CREDIT (see typescript/src/app/handlers.ts).
///
/// The subject of an attestation (the FAssets agent or the credit applicant)
/// submits their own signed verdict via their own wallet — this contract
/// never custodies keys or funds, and never sees the private inputs that
/// produced the verdict, only their keccak256 commitment.
///
/// ## Trust model (read this before trusting `submitAttestation`)
///
/// The TEE's result is ABI-encoded exactly as
/// `abi.encode(bytes32 policyId, address subject, uint8 result, uint8 tier,
/// uint256 validUntil, bytes32 inputCommitment)` by `encodeAttestationResult`
/// in typescript/src/app/abi.ts, and — per Flare's own extension-contract.md —
/// `keccak256(data)` is what tee-node signs. `submitAttestation` recovers the
/// signer from that raw hash (no EIP-191 prefix) and checks it against
/// `trustedSigners`.
///
/// `trustedSigners` is an owner-gated allowlist populated only after the
/// owner independently confirms (via Flare's `register-tee` tooling and the
/// TEE's real Confidential Space attestation) that an address is a
/// legitimately registered Solvra TEE machine. This is the same seam Flare's
/// own protocol closes over time: today, trusting a signer means trusting
/// this contract's owner to have verified attestation correctly off-chain;
/// once relying parties can query Flare's TeeMachineRegistry/VerificationFacet
/// directly on-chain for "is this address a registered TEE for extension X",
/// that check replaces the owner-gated allowlist entirely. State that
/// migration path in SECURITY.md, not just here.
contract AttestationRegistry {
    struct Attestation {
        bytes32 policyId;
        uint8 result; // 0 = FAIL, 1 = PASS — matches RESULT_CODE in policyEngine.ts
        uint8 tier; // 0 = FAIL, 1 = C, 2 = B, 3 = A — matches TIER_CODE in policyEngine.ts
        uint256 validUntil;
        uint256 issuedBlock;
        address enclaveSigner;
        bytes32 inputCommitment;
    }

    PolicyRegistry public immutable POLICY_REGISTRY;
    address public owner;

    /// @notice subject => policyId => latest attestation. A new submission overwrites
    /// the previous one for the same (subject, policyId) pair.
    mapping(address => mapping(bytes32 => Attestation)) public attestations;

    /// @notice Addresses the registry accepts TEE signatures from. See the trust-model note above.
    mapping(address => bool) public trustedSigners;

    event TrustedSignerAdded(address indexed signer);
    event TrustedSignerRemoved(address indexed signer);
    event AttestationSubmitted(
        address indexed subject,
        bytes32 indexed policyId,
        uint8 result,
        uint8 tier,
        uint256 validUntil,
        address enclaveSigner
    );
    event OwnerChanged(address indexed previousOwner, address indexed newOwner);

    error NotOwner(address caller);
    error UntrustedSigner(address signer);
    error PolicyInactive(bytes32 policyId);
    error SubjectMismatch(address expected, address actual);
    error InvalidSignatureLength(uint256 length);
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }

    constructor(PolicyRegistry _policyRegistry) {
        if (address(_policyRegistry) == address(0)) revert ZeroAddress();
        POLICY_REGISTRY = _policyRegistry;
        owner = msg.sender;
    }

    /// @notice Adds an address to the trusted-signer allowlist. Owner only.
    function addTrustedSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert ZeroAddress();
        trustedSigners[_signer] = true;
        emit TrustedSignerAdded(_signer);
    }

    /// @notice Removes an address from the trusted-signer allowlist. Owner only.
    function removeTrustedSigner(address _signer) external onlyOwner {
        trustedSigners[_signer] = false;
        emit TrustedSignerRemoved(_signer);
    }

    /// @notice Transfers ownership (and therefore control of the trusted-signer allowlist).
    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert ZeroAddress();
        emit OwnerChanged(owner, _newOwner);
        owner = _newOwner;
    }

    /// @notice Submits a TEE-signed attestation verdict. Callable by anyone holding a
    /// valid (data, signature) pair from the extension — in practice, the subject
    /// themselves, since that is who requested the evaluation.
    /// @param _subject The address the attestation is about (agentVault or credit applicant).
    ///                 Must match the `subject` field encoded inside `_data`.
    /// @param _data The exact ABI-encoded payload produced by encodeAttestationResult(...).
    /// @param _signature The 65-byte (r, s, v) ECDSA signature tee-node produced over keccak256(_data).
    function submitAttestation(address _subject, bytes calldata _data, bytes calldata _signature) external {
        address signer = _recoverSigner(keccak256(_data), _signature);
        if (!trustedSigners[signer]) revert UntrustedSigner(signer);

        (bytes32 policyId, address subject, uint8 result, uint8 tier, uint256 validUntil, bytes32 inputCommitment) =
            abi.decode(_data, (bytes32, address, uint8, uint8, uint256, bytes32));

        if (subject != _subject) revert SubjectMismatch(_subject, subject);
        if (!POLICY_REGISTRY.isActive(policyId)) revert PolicyInactive(policyId);

        attestations[subject][policyId] = Attestation({
            policyId: policyId,
            result: result,
            tier: tier,
            validUntil: validUntil,
            issuedBlock: block.number,
            enclaveSigner: signer,
            inputCommitment: inputCommitment
        });

        emit AttestationSubmitted(subject, policyId, result, tier, validUntil, signer);
    }

    /// @notice Returns whether `_subject` currently holds a PASS, non-expired attestation for `_policyId`.
    /// @return passed True if the latest attestation is PASS and not yet expired.
    /// @return tier The tier of the latest attestation (meaningful only if passed is true).
    /// @return validUntil The expiry timestamp of the latest attestation.
    function isValid(address _subject, bytes32 _policyId)
        external
        view
        returns (bool passed, uint8 tier, uint256 validUntil)
    {
        Attestation storage a = attestations[_subject][_policyId];
        // forge-lint: disable-next-line(block-timestamp)
        passed = a.result == 1 && block.timestamp <= a.validUntil;
        return (passed, a.tier, a.validUntil);
    }

    /// @dev Recovers the signer of `_digest` from a standard 65-byte (r, s, v) signature,
    /// with no EIP-191 prefix applied — matching tee-node's raw keccak256(data) signing.
    /// Rejects the malleable high-s range per EIP-2, same guard OpenZeppelin's ECDSA uses.
    function _recoverSigner(bytes32 _digest, bytes calldata _signature) internal pure returns (address) {
        if (_signature.length != 65) revert InvalidSignatureLength(_signature.length);

        bytes32 r = bytes32(_signature[0:32]);
        bytes32 s = bytes32(_signature[32:64]);
        uint8 v = uint8(_signature[64]);
        if (v < 27) v += 27;

        require(
            uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0,
            "AttestationRegistry: invalid signature 's' value"
        );
        require(v == 27 || v == 28, "AttestationRegistry: invalid signature 'v' value");

        address recovered = ecrecover(_digest, v, r, s);
        require(recovered != address(0), "AttestationRegistry: invalid signature");
        return recovered;
    }
}
