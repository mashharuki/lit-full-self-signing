// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {
    PKPToolPolicyRegistry,
    InvalidPKPAddress,
    EmptyIPFSCID,
    EmptyPolicy,
    ActionNotFound
} from "../src/PKPToolPolicyRegistry.sol";

contract PKPToolPolicyRegistryTest is Test {
    PKPToolPolicyRegistry public registry;
    address public pkp;
    string public constant IPFS_CID = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";
    bytes public constant POLICY = abi.encode(uint256(1e18), "ETH");
    string public constant VERSION = "1.0.0";

    event ActionPolicySet(
        address indexed pkp,
        string ipfsCid,
        bytes policy,
        string version
    );

    event ActionPolicyRemoved(address indexed pkp, string ipfsCid);

    function setUp() public {
        registry = new PKPToolPolicyRegistry();
        pkp = makeAddr("pkp");
    }

    function test_SetActionPolicy() public {
        vm.startPrank(pkp);

        vm.expectEmit(true, false, false, true);
        emit ActionPolicySet(pkp, IPFS_CID, POLICY, VERSION);
        
        registry.setActionPolicy(IPFS_CID, POLICY, VERSION);

        (bytes memory storedPolicy, string memory storedVersion) = registry.getActionPolicy(pkp, IPFS_CID);
        assertEq(storedPolicy, POLICY);
        assertEq(storedVersion, VERSION);

        vm.stopPrank();
    }

    function test_SetActionPolicy_UpdateExisting() public {
        vm.startPrank(pkp);

        // Set initial policy
        registry.setActionPolicy(IPFS_CID, POLICY, VERSION);

        // Update with new policy
        bytes memory newPolicy = abi.encode(uint256(2e18), "USDC");
        string memory newVersion = "1.0.1";

        vm.expectEmit(true, false, false, true);
        emit ActionPolicySet(pkp, IPFS_CID, newPolicy, newVersion);

        registry.setActionPolicy(IPFS_CID, newPolicy, newVersion);

        (bytes memory storedPolicy, string memory storedVersion) = registry.getActionPolicy(pkp, IPFS_CID);
        assertEq(storedPolicy, newPolicy);
        assertEq(storedVersion, newVersion);

        vm.stopPrank();
    }

    function test_RemoveActionPolicy() public {
        vm.startPrank(pkp);

        // First set a policy
        registry.setActionPolicy(IPFS_CID, POLICY, VERSION);

        vm.expectEmit(true, false, false, true);
        emit ActionPolicyRemoved(pkp, IPFS_CID);

        registry.removeActionPolicy(IPFS_CID);

        // Verify policy is removed
        (bytes memory storedPolicy, string memory storedVersion) = registry.getActionPolicy(pkp, IPFS_CID);
        assertEq(storedPolicy, "");
        assertEq(storedVersion, "");

        vm.stopPrank();
    }

    function test_GetRegisteredActions() public {
        vm.startPrank(pkp);

        // Set multiple policies
        string memory cid1 = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";
        string memory cid2 = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGy";
        bytes memory policy1 = abi.encode(uint256(1e18), "ETH");
        bytes memory policy2 = abi.encode(uint256(2e18), "USDC");
        string memory version1 = "1.0.0";
        string memory version2 = "1.0.1";

        registry.setActionPolicy(cid1, policy1, version1);
        registry.setActionPolicy(cid2, policy2, version2);

        (
            string[] memory ipfsCids,
            bytes[] memory policyData,
            string[] memory versions
        ) = registry.getRegisteredActions(pkp);

        assertEq(ipfsCids.length, 2);
        assertEq(policyData.length, 2);
        assertEq(versions.length, 2);

        // Verify first policy
        assertEq(ipfsCids[0], cid1);
        assertEq(policyData[0], policy1);
        assertEq(versions[0], version1);

        // Verify second policy
        assertEq(ipfsCids[1], cid2);
        assertEq(policyData[1], policy2);
        assertEq(versions[1], version2);

        vm.stopPrank();
    }

    function test_RevertWhen_ZeroAddress() public {
        vm.prank(address(0));
        vm.expectRevert(InvalidPKPAddress.selector);
        registry.setActionPolicy(IPFS_CID, POLICY, VERSION);

        vm.prank(address(0));
        vm.expectRevert(InvalidPKPAddress.selector);
        registry.removeActionPolicy(IPFS_CID);
    }

    function test_RevertWhen_EmptyIPFSCID() public {
        vm.startPrank(pkp);

        vm.expectRevert(EmptyIPFSCID.selector);
        registry.setActionPolicy("", POLICY, VERSION);

        vm.expectRevert(EmptyIPFSCID.selector);
        registry.removeActionPolicy("");

        vm.stopPrank();
    }

    function test_RevertWhen_EmptyPolicy() public {
        vm.startPrank(pkp);

        vm.expectRevert(EmptyPolicy.selector);
        registry.setActionPolicy(IPFS_CID, "", VERSION);

        vm.stopPrank();
    }

    function test_RevertWhen_ActionNotFound() public {
        vm.startPrank(pkp);

        vm.expectRevert(abi.encodeWithSelector(ActionNotFound.selector, IPFS_CID));
        registry.removeActionPolicy(IPFS_CID);

        vm.stopPrank();
    }

    function test_RemoveActionPolicy_WithMultipleActions() public {
        vm.startPrank(pkp);

        // Set multiple policies
        string memory cid1 = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";
        string memory cid2 = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGy";
        string memory cid3 = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGz";
        
        registry.setActionPolicy(cid1, POLICY, VERSION);
        registry.setActionPolicy(cid2, POLICY, VERSION);
        registry.setActionPolicy(cid3, POLICY, VERSION);

        // Remove middle policy
        registry.removeActionPolicy(cid2);

        (
            string[] memory ipfsCids,
            bytes[] memory policyData,
            string[] memory versions
        ) = registry.getRegisteredActions(pkp);

        // Verify length
        assertEq(ipfsCids.length, 2);
        assertEq(policyData.length, 2);
        assertEq(versions.length, 2);

        // Verify remaining policies
        assertEq(ipfsCids[0], cid1);
        assertEq(ipfsCids[1], cid3);
        assertEq(policyData[0], POLICY);
        assertEq(policyData[1], POLICY);
        assertEq(versions[0], VERSION);
        assertEq(versions[1], VERSION);

        vm.stopPrank();
    }
}
