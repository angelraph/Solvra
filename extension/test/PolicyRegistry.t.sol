// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Test } from "forge-std/Test.sol";
import { PolicyRegistry } from "../contracts/PolicyRegistry.sol";

contract PolicyRegistryTest is Test {
    PolicyRegistry internal registry;

    bytes32 internal constant POLICY_ID = bytes32("fassets-agent-solvency-v1");
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        registry = new PolicyRegistry();
    }

    function test_registerPolicy_storesMetadata() public {
        vm.prank(alice);
        registry.registerPolicy(
            POLICY_ID, "FAssets Agent Solvency", "ipfs://policy", bytes32("ruleset-v1"), PolicyRegistry.PolicyType.FAssetsAgentSolvency
        );

        PolicyRegistry.Policy memory p = registry.getPolicy(POLICY_ID);
        assertEq(p.owner, alice);
        assertEq(p.name, "FAssets Agent Solvency");
        assertEq(p.metadataURI, "ipfs://policy");
        assertEq(p.rulesetHash, bytes32("ruleset-v1"));
        assertTrue(p.active);
        assertEq(uint8(p.policyType), uint8(PolicyRegistry.PolicyType.FAssetsAgentSolvency));
    }

    function test_registerPolicy_revertsOnDuplicateId() public {
        vm.prank(alice);
        registry.registerPolicy(POLICY_ID, "First", "uri", bytes32(0), PolicyRegistry.PolicyType.Generic);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(PolicyRegistry.PolicyAlreadyExists.selector, POLICY_ID));
        registry.registerPolicy(POLICY_ID, "Second", "uri", bytes32(0), PolicyRegistry.PolicyType.Generic);
    }

    function test_registerPolicy_revertsOnEmptyName() public {
        vm.expectRevert(PolicyRegistry.EmptyName.selector);
        registry.registerPolicy(POLICY_ID, "", "uri", bytes32(0), PolicyRegistry.PolicyType.Generic);
    }

    function test_updatePolicy_ownerOnly() public {
        vm.prank(alice);
        registry.registerPolicy(POLICY_ID, "Name", "old-uri", bytes32(0), PolicyRegistry.PolicyType.Generic);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(PolicyRegistry.NotPolicyOwner.selector, POLICY_ID, bob));
        registry.updatePolicy(POLICY_ID, "new-uri", bytes32("v2"));

        vm.prank(alice);
        registry.updatePolicy(POLICY_ID, "new-uri", bytes32("v2"));
        PolicyRegistry.Policy memory p = registry.getPolicy(POLICY_ID);
        assertEq(p.metadataURI, "new-uri");
        assertEq(p.rulesetHash, bytes32("v2"));
    }

    function test_setPolicyActive_togglesAndGatesIsActive() public {
        vm.startPrank(alice);
        registry.registerPolicy(POLICY_ID, "Name", "uri", bytes32(0), PolicyRegistry.PolicyType.Generic);
        assertTrue(registry.isActive(POLICY_ID));

        registry.setPolicyActive(POLICY_ID, false);
        assertFalse(registry.isActive(POLICY_ID));

        registry.setPolicyActive(POLICY_ID, true);
        assertTrue(registry.isActive(POLICY_ID));
        vm.stopPrank();
    }

    function test_isActive_falseForUnregisteredPolicy() public view {
        assertFalse(registry.isActive(bytes32("does-not-exist")));
    }

    function test_getPolicy_revertsForUnregisteredPolicy() public {
        vm.expectRevert(abi.encodeWithSelector(PolicyRegistry.PolicyDoesNotExist.selector, bytes32("nope")));
        registry.getPolicy(bytes32("nope"));
    }
}
