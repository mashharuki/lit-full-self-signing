// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Custom errors for better gas efficiency and clearer error messages
error InvalidPKPAddress();
error ActionNotFound(string ipfsCid);
error EmptyIPFSCID();
error EmptyPolicy();

/**
 * @title PKPToolPolicyRegistry
 * @dev Registry for managing PKP-specific tool policies. Each PKP can set
 * policies for tools it wants to execute. The PKP must be the caller of
 * setActionPolicy, which ensures that only authorized users (through Lit's PKP
 * authentication) can set policies.
 *
 * Each tool has a policy - Tool-specific configuration bytes that must be ABI encoded
 *
 * Policy Format:
 * The policy field must be ABI encoded data using abi.encode().
 * Example:
 * - abi.encode(uint256 maxAmount, address[] allowedTokens)
 * - abi.encode(bytes32 role, uint256 threshold)
 *
 * IPFS CID Format:
 * - Must be a valid IPFS CID v0 (e.g., "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx")
 * - Represents the content hash of the tool code stored on IPFS
 * - CID v1 is not supported
 * - Cannot be empty
 *
 * Policies:
 * - Must not be empty (use removeActionPolicy to remove a policy)
 * - Must be properly ABI encoded
 * - Version must be specified
 *
 * Example Usage:
 * ```solidity
 * // Set policy for an ERC20 transfer tool (must be called by the PKP itself)
 * bytes memory policy = abi.encode(
 *     uint256(1e18),    // maxAmount
 *     "ETH"            // token
 * );
 * registry.setActionPolicy(
 *     "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx",
 *     policy,
 *     "1.0.0"
 * );
 * ```
 */
contract PKPToolPolicyRegistry {
    /**
     * @dev Stores the policy for a specific tool
     * @param policy Tool-specific configuration bytes that must be ABI encoded using abi.encode()
     * @param version Version of the policy (e.g., "1.0.0")
     */
    struct ActionPolicy {
        bytes policy; // Tool-specific ABI encoded configuration bytes
        string version; // Version of the policy
    }

    /// @dev Maps PKP address -> IPFS CID -> policy
    mapping(address => mapping(string => ActionPolicy)) public policies;

    /// @dev Maps PKP address -> list of registered IPFS CIDs
    mapping(address => string[]) internal registeredActions;

    /// @dev Maps PKP address -> IPFS CID -> index in registeredActions array
    mapping(address => mapping(string => uint256)) internal actionIndices;

    /// @dev Emitted when a tool policy is set or updated
    event ActionPolicySet(
        address indexed pkp,
        string ipfsCid,
        bytes policy,
        string version
    );

    /// @dev Emitted when a tool policy is removed
    event ActionPolicyRemoved(address indexed pkp, string ipfsCid);

    /**
     * @dev Set or update a policy for a specific tool
     * @notice This function must be called by the PKP itself
     * @notice Use removeActionPolicy to remove a policy, not an empty policy
     * @param ipfsCid IPFS CID of the tool
     * @param policy Tool-specific policy bytes that must be ABI encoded
     * @param version Version of the policy
     */
    function setActionPolicy(
        string calldata ipfsCid,
        bytes calldata policy,
        string calldata version
    ) external {
        if (msg.sender == address(0)) revert InvalidPKPAddress();
        if (bytes(ipfsCid).length == 0) revert EmptyIPFSCID();
        if (policy.length == 0) revert EmptyPolicy();

        ActionPolicy storage actionPolicy = policies[msg.sender][ipfsCid];

        // If this is a new action, add it to the list
        if (actionPolicy.policy.length == 0) {
            actionIndices[msg.sender][ipfsCid] = registeredActions[msg.sender].length;
            registeredActions[msg.sender].push(ipfsCid);
        }

        actionPolicy.policy = policy;
        actionPolicy.version = version;

        emit ActionPolicySet(msg.sender, ipfsCid, policy, version);
    }

    /**
     * @dev Remove a policy for a specific tool
     * @notice This function must be called by the PKP itself
     * @param ipfsCid IPFS CID of the tool to remove
     */
    function removeActionPolicy(string calldata ipfsCid) external {
        if (msg.sender == address(0)) revert InvalidPKPAddress();
        if (bytes(ipfsCid).length == 0) revert EmptyIPFSCID();

        // Get the index of the IPFS CID in the array
        uint256 index = actionIndices[msg.sender][ipfsCid];
        string[] storage actions = registeredActions[msg.sender];

        // Check if the action exists
        if (index >= actions.length || 
            keccak256(bytes(actions[index])) != keccak256(bytes(ipfsCid))) {
            revert ActionNotFound(ipfsCid);
        }

        // Get the last element's CID
        string memory lastCid = actions[actions.length - 1];

        // If we're not removing the last element, move the last element to the removed position
        if (index != actions.length - 1) {
            actions[index] = lastCid;
            actionIndices[msg.sender][lastCid] = index;
        }

        // Remove the last element and clean up storage
        actions.pop();
        delete policies[msg.sender][ipfsCid];
        delete actionIndices[msg.sender][ipfsCid];

        emit ActionPolicyRemoved(msg.sender, ipfsCid);
    }

    /**
     * @dev Get the policy for a specific tool
     * @param pkp Address of the PKP
     * @param ipfsCid IPFS CID of the tool
     * @return policy The ABI encoded policy struct
     * @return version Version of the policy
     */
    function getActionPolicy(address pkp, string calldata ipfsCid)
        external
        view
        returns (bytes memory policy, string memory version)
    {
        ActionPolicy storage actionPolicy = policies[pkp][ipfsCid];
        return (actionPolicy.policy, actionPolicy.version);
    }

    /**
     * @dev Get all registered tools and their policies for a PKP
     * @param pkp Address of the PKP
     * @return ipfsCids Array of IPFS CIDs for registered tools
     * @return policyData Array of ABI encoded policy structs
     * @return versions Array of policy versions
     */
    function getRegisteredActions(address pkp)
        external
        view
        returns (
            string[] memory ipfsCids,
            bytes[] memory policyData,
            string[] memory versions
        )
    {
        string[] storage actionsList = registeredActions[pkp];
        uint256 length = actionsList.length;

        ipfsCids = new string[](length);
        policyData = new bytes[](length);
        versions = new string[](length);

        for (uint256 i = 0; i < length; i++) {
            string memory currentCid = actionsList[i];
            ipfsCids[i] = currentCid;
            
            ActionPolicy storage currentPolicy = policies[pkp][currentCid];
            policyData[i] = currentPolicy.policy;
            versions[i] = currentPolicy.version;
        }

        return (ipfsCids, policyData, versions);
    }
}
