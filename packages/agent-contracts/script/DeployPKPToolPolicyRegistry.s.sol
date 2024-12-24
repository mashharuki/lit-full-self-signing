// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PKPToolPolicyRegistry.sol";

contract DeployPKPToolPolicyRegistry is Script {
    function run() external {
        // Get private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("PKP_TOOL_POLICY_REGISTRY_DEPLOYER_PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the registry
        PKPToolPolicyRegistry registry = new PKPToolPolicyRegistry();
        
        // Stop broadcasting transactions
        vm.stopBroadcast();

        // Log the deployment
        console.log("PKPToolPolicyRegistry deployed to:", address(registry));
    }
} 