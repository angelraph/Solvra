// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Test } from "forge-std/Test.sol";
import { PolicyRegistry } from "../contracts/PolicyRegistry.sol";
import { AttestationRegistry } from "../contracts/AttestationRegistry.sol";

contract AttestationRegistryTest is Test {
    PolicyRegistry internal policyRegistry;
    AttestationRegistry internal attestationRegistry;

    bytes32 internal constant POLICY_ID = bytes32("fassets-agent-solvency-v1");

    uint256 internal enclavePrivateKey = 0xA11CE5EED;
    address internal enclaveSigner;

    address internal registryOwner = address(this);
    address internal subject = address(0x5013);

    function setUp() public {
        policyRegistry = new PolicyRegistry();
        attestationRegistry = new AttestationRegistry(policyRegistry);

        enclaveSigner = vm.addr(enclavePrivateKey);

        policyRegistry.registerPolicy(
            POLICY_ID, "FAssets Agent Solvency", "uri", bytes32("v1"), PolicyRegistry.PolicyType.FAssetsAgentSolvency
        );
    }

    /// @dev Mirrors encodeAttestationResult(...) in typescript/src/app/abi.ts exactly:
    /// abi.encode(bytes32 policyId, address subject, uint8 result, uint8 tier, uint256 validUntil, bytes32 inputCommitment).
    function _buildPayload(uint8 _result, uint8 _tier, uint256 _validUntil, bytes32 _commitment)
        internal
        view
        returns (bytes memory)
    {
        return abi.encode(POLICY_ID, subject, _result, _tier, _validUntil, _commitment);
    }

    /// @dev Signs raw keccak256(data) with no EIP-191 prefix, matching tee-node's
    /// documented ActionResult.Hash() signing convention.
    function _sign(uint256 _key, bytes memory _data) internal pure returns (bytes memory) {
        bytes32 digest = keccak256(_data);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_key, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_submitAttestation_acceptsValidSignatureFromTrustedSigner() public {
        attestationRegistry.addTrustedSigner(enclaveSigner);

        uint256 validUntil = block.timestamp + 1 days;
        bytes memory data = _buildPayload(1, 3, validUntil, bytes32("commit"));
        bytes memory sig = _sign(enclavePrivateKey, data);

        attestationRegistry.submitAttestation(subject, data, sig);

        (bool passed, uint8 tier, uint256 storedValidUntil) = attestationRegistry.isValid(subject, POLICY_ID);
        assertTrue(passed);
        assertEq(tier, 3);
        assertEq(storedValidUntil, validUntil);
    }

    function test_submitAttestation_revertsForUntrustedSigner() public {
        // Note: enclaveSigner is never added to the trusted-signer allowlist here.
        uint256 validUntil = block.timestamp + 1 days;
        bytes memory data = _buildPayload(1, 3, validUntil, bytes32("commit"));
        bytes memory sig = _sign(enclavePrivateKey, data);

        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.UntrustedSigner.selector, enclaveSigner));
        attestationRegistry.submitAttestation(subject, data, sig);
    }

    function test_submitAttestation_revertsOnSubjectMismatch() public {
        attestationRegistry.addTrustedSigner(enclaveSigner);

        bytes memory data = _buildPayload(1, 3, block.timestamp + 1 days, bytes32("commit"));
        bytes memory sig = _sign(enclavePrivateKey, data);

        address wrongSubject = address(0xBAD);
        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.SubjectMismatch.selector, wrongSubject, subject));
        attestationRegistry.submitAttestation(wrongSubject, data, sig);
    }

    function test_submitAttestation_revertsForInactivePolicy() public {
        attestationRegistry.addTrustedSigner(enclaveSigner);
        policyRegistry.setPolicyActive(POLICY_ID, false);

        bytes memory data = _buildPayload(1, 3, block.timestamp + 1 days, bytes32("commit"));
        bytes memory sig = _sign(enclavePrivateKey, data);

        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.PolicyInactive.selector, POLICY_ID));
        attestationRegistry.submitAttestation(subject, data, sig);
    }

    function test_submitAttestation_revertsOnTamperedData() public {
        attestationRegistry.addTrustedSigner(enclaveSigner);

        bytes memory data = _buildPayload(1, 3, block.timestamp + 1 days, bytes32("commit"));
        bytes memory sig = _sign(enclavePrivateKey, data);

        // Tamper with the result after signing — the recovered signer must not match.
        bytes memory tampered = _buildPayload(0, 0, block.timestamp + 1 days, bytes32("commit"));

        vm.expectRevert(); // recovers to a different (untrusted) address, or ecrecover fails outright
        attestationRegistry.submitAttestation(subject, tampered, sig);
    }

    function test_isValid_falseAfterExpiry() public {
        attestationRegistry.addTrustedSigner(enclaveSigner);

        uint256 validUntil = block.timestamp + 1 hours;
        bytes memory data = _buildPayload(1, 2, validUntil, bytes32("commit"));
        bytes memory sig = _sign(enclavePrivateKey, data);
        attestationRegistry.submitAttestation(subject, data, sig);

        vm.warp(validUntil + 1);

        (bool passed,,) = attestationRegistry.isValid(subject, POLICY_ID);
        assertFalse(passed);
    }

    function test_isValid_falseForFailResult() public {
        attestationRegistry.addTrustedSigner(enclaveSigner);

        bytes memory data = _buildPayload(0, 0, block.timestamp + 1 days, bytes32("commit"));
        bytes memory sig = _sign(enclavePrivateKey, data);
        attestationRegistry.submitAttestation(subject, data, sig);

        (bool passed,,) = attestationRegistry.isValid(subject, POLICY_ID);
        assertFalse(passed);
    }

    function test_isValid_falseWhenNeverSubmitted() public view {
        (bool passed, uint8 tier, uint256 validUntil) = attestationRegistry.isValid(subject, POLICY_ID);
        assertFalse(passed);
        assertEq(tier, 0);
        assertEq(validUntil, 0);
    }

    function test_removeTrustedSigner_revokesFutureSubmissions() public {
        attestationRegistry.addTrustedSigner(enclaveSigner);
        attestationRegistry.removeTrustedSigner(enclaveSigner);

        bytes memory data = _buildPayload(1, 3, block.timestamp + 1 days, bytes32("commit"));
        bytes memory sig = _sign(enclavePrivateKey, data);

        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.UntrustedSigner.selector, enclaveSigner));
        attestationRegistry.submitAttestation(subject, data, sig);
    }

    function test_addTrustedSigner_ownerOnly() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.NotOwner.selector, address(0xDEAD)));
        attestationRegistry.addTrustedSigner(enclaveSigner);
    }

    function test_transferOwnership_movesControl() public {
        address newOwner = address(0xF00D);
        attestationRegistry.transferOwnership(newOwner);
        assertEq(attestationRegistry.owner(), newOwner);

        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.NotOwner.selector, registryOwner));
        attestationRegistry.addTrustedSigner(enclaveSigner);
    }
}
