// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/LitAgentRegistry.sol";

contract LitAgentRegistryTest is Test {
    LitAgentRegistry public registry;
    address public user;
    address public pkp;

    // Test data
    string constant TEST_IPFS_CID = "QmTest123";
    bytes constant TEST_DESCRIPTION = "Test Lit Action for swapping tokens";
    bytes constant TEST_POLICY = "0x1234";

    function setUp() public {
        registry = new LitAgentRegistry();
        user = address(1);
        pkp = address(2);

        // Set user as msg.sender for testing
        vm.startPrank(user);
    }

    function testRegisterPKP() public {
        registry.registerPKP(pkp);

        // Try to register same PKP again - should revert
        vm.expectRevert("PKP already registered");
        registry.registerPKP(pkp);
    }

    function testSetActionPolicy() public {
        // Should revert if PKP not registered
        vm.expectRevert("PKP not registered");
        registry.setActionPolicy(pkp, TEST_IPFS_CID, TEST_DESCRIPTION, TEST_POLICY);

        // Register PKP first
        registry.registerPKP(pkp);

        // Should revert if description is empty
        vm.expectRevert("Description is required");
        registry.setActionPolicy(pkp, TEST_IPFS_CID, "", TEST_POLICY);

        // Set valid policy
        registry.setActionPolicy(pkp, TEST_IPFS_CID, TEST_DESCRIPTION, TEST_POLICY);

        // Verify policy was set correctly
        (bool isPermitted, bytes memory description, bytes memory policy) =
            registry.getActionPolicy(user, pkp, TEST_IPFS_CID);
        assertTrue(isPermitted);
        assertEq(description, TEST_DESCRIPTION);
        assertEq(policy, TEST_POLICY);
    }

    function testRemoveActionPolicy() public {
        // Setup: register PKP and set policy
        registry.registerPKP(pkp);
        registry.setActionPolicy(pkp, TEST_IPFS_CID, TEST_DESCRIPTION, TEST_POLICY);

        // Remove the policy
        registry.removeActionPolicy(pkp, TEST_IPFS_CID);

        // Verify policy was removed
        (bool isPermitted, bytes memory description, bytes memory policy) =
            registry.getActionPolicy(user, pkp, TEST_IPFS_CID);
        assertFalse(isPermitted);
        assertEq(description, "");
        assertEq(policy, "");
    }

    function testGetRegisteredActions() public {
        // Setup: register PKP and set multiple policies
        registry.registerPKP(pkp);
        registry.setActionPolicy(pkp, TEST_IPFS_CID, TEST_DESCRIPTION, TEST_POLICY);

        string memory secondCid = "QmTest456";
        bytes memory secondDesc = "Second test action";
        bytes memory secondPolicy = "0x5678";
        registry.setActionPolicy(pkp, secondCid, secondDesc, secondPolicy);

        // Get all registered actions
        (string[] memory ipfsCids, bytes[] memory descriptions, bytes[] memory policies) =
            registry.getRegisteredActions(user, pkp);

        // Verify arrays length
        assertEq(ipfsCids.length, 2);
        assertEq(descriptions.length, 2);
        assertEq(policies.length, 2);

        // Verify contents (order might vary)
        bool foundFirst = false;
        bool foundSecond = false;

        for (uint256 i = 0; i < ipfsCids.length; i++) {
            if (keccak256(bytes(ipfsCids[i])) == keccak256(bytes(TEST_IPFS_CID))) {
                assertEq(descriptions[i], TEST_DESCRIPTION);
                assertEq(policies[i], TEST_POLICY);
                foundFirst = true;
            } else if (keccak256(bytes(ipfsCids[i])) == keccak256(bytes(secondCid))) {
                assertEq(descriptions[i], secondDesc);
                assertEq(policies[i], secondPolicy);
                foundSecond = true;
            }
        }

        assertTrue(foundFirst && foundSecond);
    }

    function testGetActionPolicyNonexistentPKP() public {
        vm.expectRevert("PKP not registered");
        registry.getActionPolicy(user, pkp, TEST_IPFS_CID);
    }

    function testGetRegisteredActionsNonexistentPKP() public {
        vm.expectRevert("PKP not registered");
        registry.getRegisteredActions(user, pkp);
    }
}
