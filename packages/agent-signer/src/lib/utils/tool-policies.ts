import { ethers } from 'ethers';
import type { SigResponse } from '@lit-protocol/types';
import { SetToolPolicyOptions, ToolPolicy, RegisteredTools } from '../types';

const TOOL_POLICY_ABI = [
  'function setActionPolicy(string calldata ipfsCid, bytes calldata policy, string calldata version) external',
  'function removeActionPolicy(string calldata ipfsCid) external',
  'function getActionPolicy(address pkp, string calldata ipfsCid) external view returns (bytes memory policy, string memory version)',
  'function getRegisteredActions(address pkp) external view returns (string[] memory ipfsCids, bytes[] memory policyData, string[] memory versions)',
];

/**
 * Create a tool policy contract instance
 */
export function createToolPolicyContract(
  contractAddress: string,
  provider: ethers.providers.Provider
): ethers.Contract {
  return new ethers.Contract(contractAddress, TOOL_POLICY_ABI, provider);
}

/**
 * Set or update a policy for a specific tool
 */
export async function setToolPolicy(
  contract: ethers.Contract,
  pkpAddress: string,
  signCallback: (toSign: string) => Promise<SigResponse>,
  provider: ethers.providers.Provider,
  options: SetToolPolicyOptions
): Promise<ethers.ContractTransaction> {
  const { ipfsCid, policy, version } = options;

  // ABI encode the policy data
  const encodedPolicy = ethers.utils.defaultAbiCoder.encode(
    [typeof policy === 'object' ? 'tuple' : typeof policy],
    [policy]
  );

  // Encode the function call
  const data = contract.interface.encodeFunctionData('setActionPolicy', [
    ipfsCid,
    encodedPolicy,
    version,
  ]);

  // Sign and send the transaction
  const tx = {
    to: contract.address,
    data,
  };

  const signature = await signCallback(
    ethers.utils.keccak256(ethers.utils.serializeTransaction(tx))
  );

  // Send the signed transaction
  const signedTx = ethers.utils.serializeTransaction(tx, signature.signature);
  return provider.sendTransaction(signedTx);
}

/**
 * Remove a policy for a specific tool
 */
export async function removeToolPolicy(
  contract: ethers.Contract,
  pkpAddress: string,
  signCallback: (toSign: string) => Promise<SigResponse>,
  provider: ethers.providers.Provider,
  ipfsCid: string
): Promise<ethers.ContractTransaction> {
  // Encode the function call
  const data = contract.interface.encodeFunctionData('removeActionPolicy', [
    ipfsCid,
  ]);

  // Sign and send the transaction
  const tx = {
    to: contract.address,
    data,
  };

  const signature = await signCallback(
    ethers.utils.keccak256(ethers.utils.serializeTransaction(tx))
  );

  // Send the signed transaction
  const signedTx = ethers.utils.serializeTransaction(tx, signature.signature);
  return provider.sendTransaction(signedTx);
}

/**
 * Get the policy for a specific tool
 */
export async function getToolPolicy(
  contract: ethers.Contract,
  pkpAddress: string,
  ipfsCid: string
): Promise<ToolPolicy> {
  const [policy, version] = await contract.getActionPolicy(pkpAddress, ipfsCid);
  return { policy, version };
}

/**
 * Get all registered tools and their policies
 */
export async function getRegisteredTools(
  contract: ethers.Contract,
  pkpAddress: string
): Promise<RegisteredTools> {
  const [ipfsCids, policyData, versions] = await contract.getRegisteredActions(
    pkpAddress
  );
  return { ipfsCids, policyData, versions };
}
