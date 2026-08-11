// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title PolicyRegistry
/// @author Solvra
/// @notice Registers the named policies Solvra's TEE extension knows how to evaluate.
///
/// A policy here is metadata only — it does not hold the rule logic itself.
/// The rule logic lives in the TEE extension (typescript/src/app/policyEngine.ts
/// and its two policy handlers), and `rulesetHash` is a commitment to that
/// logic's version so anyone can confirm which ruleset produced a given
/// attestation. Two policy types are registered against this one contract
/// (FAssetsAgentSolvency and ConsumerCreditLine) as the concrete proof that
/// Solvra is a general "prove a policy without revealing the data" protocol,
/// not a single-purpose lending app.
contract PolicyRegistry {
    enum PolicyType {
        FAssetsAgentSolvency,
        ConsumerCreditLine,
        Generic
    }

    struct Policy {
        address owner;
        string name;
        string metadataURI;
        bytes32 rulesetHash;
        PolicyType policyType;
        bool active;
        uint256 createdAt;
    }

    /// @notice policyId => policy metadata. policyId is the same bytes32-encoded
    /// ASCII identifier the TEE extension uses (see policyIdToBytes32 in abi.ts),
    /// e.g. bytes32("fassets-agent-solvency-v1").
    mapping(bytes32 => Policy) public policies;

    event PolicyRegistered(
        bytes32 indexed policyId,
        address indexed owner,
        string name,
        PolicyType policyType,
        bytes32 rulesetHash
    );
    event PolicyUpdated(bytes32 indexed policyId, string metadataURI, bytes32 rulesetHash);
    event PolicyActiveSet(bytes32 indexed policyId, bool active);

    error PolicyAlreadyExists(bytes32 policyId);
    error PolicyDoesNotExist(bytes32 policyId);
    error NotPolicyOwner(bytes32 policyId, address caller);
    error EmptyName();

    modifier onlyPolicyOwner(bytes32 _policyId) {
        if (policies[_policyId].owner == address(0)) revert PolicyDoesNotExist(_policyId);
        if (policies[_policyId].owner != msg.sender) revert NotPolicyOwner(_policyId, msg.sender);
        _;
    }

    /// @notice Registers a new policy. Reverts if a policy with this id already exists.
    /// @param _policyId Bytes32-encoded ASCII policy identifier.
    /// @param _name Human-readable policy name.
    /// @param _metadataURI Off-chain pointer to the full policy description (e.g. IPFS/HTTPS URI).
    /// @param _rulesetHash keccak256 commitment to the exact rule logic the TEE evaluates for this policy.
    /// @param _policyType Which policy family this belongs to.
    function registerPolicy(
        bytes32 _policyId,
        string calldata _name,
        string calldata _metadataURI,
        bytes32 _rulesetHash,
        PolicyType _policyType
    ) external {
        if (policies[_policyId].owner != address(0)) revert PolicyAlreadyExists(_policyId);
        if (bytes(_name).length == 0) revert EmptyName();

        policies[_policyId] = Policy({
            owner: msg.sender,
            name: _name,
            metadataURI: _metadataURI,
            rulesetHash: _rulesetHash,
            policyType: _policyType,
            active: true,
            createdAt: block.timestamp
        });

        emit PolicyRegistered(_policyId, msg.sender, _name, _policyType, _rulesetHash);
    }

    /// @notice Updates a policy's metadata pointer and ruleset commitment. Owner only.
    function updatePolicy(bytes32 _policyId, string calldata _metadataURI, bytes32 _rulesetHash)
        external
        onlyPolicyOwner(_policyId)
    {
        Policy storage p = policies[_policyId];
        p.metadataURI = _metadataURI;
        p.rulesetHash = _rulesetHash;
        emit PolicyUpdated(_policyId, _metadataURI, _rulesetHash);
    }

    /// @notice Activates or deactivates a policy. Owner only. Inactive policies are
    /// rejected by AttestationRegistry.submitAttestation.
    function setPolicyActive(bytes32 _policyId, bool _active) external onlyPolicyOwner(_policyId) {
        policies[_policyId].active = _active;
        emit PolicyActiveSet(_policyId, _active);
    }

    /// @notice Returns a policy's metadata. Reverts if it does not exist.
    function getPolicy(bytes32 _policyId) external view returns (Policy memory) {
        if (policies[_policyId].owner == address(0)) revert PolicyDoesNotExist(_policyId);
        return policies[_policyId];
    }

    /// @notice Returns whether a policy exists and is currently active.
    function isActive(bytes32 _policyId) external view returns (bool) {
        return policies[_policyId].owner != address(0) && policies[_policyId].active;
    }
}
