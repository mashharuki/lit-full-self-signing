import { ethers } from 'ethers';
import type { SigResponse } from '@lit-protocol/types';
import { SetToolPolicyOptions, ToolPolicy, RegisteredTools } from '../types';
import { LitAgentError, LitAgentErrorType } from '../errors';

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

  try {
    // Ensure maxAmount is a valid BigNumber
    const maxAmount = ethers.BigNumber.from(policy.maxAmount);

    // Validate addresses in arrays
    const allowedTokens = (policy.allowedTokens || []).map((addr: string) =>
      ethers.utils.getAddress(addr)
    );
    const allowedRecipients = (policy.allowedRecipients || []).map(
      (addr: string) => ethers.utils.getAddress(addr)
    );

    // ABI encode the policy data with the correct format
    const encodedPolicy = ethers.utils.defaultAbiCoder.encode(
      [
        'tuple(uint256 maxAmount, address[] allowedTokens, address[] allowedRecipients)',
      ],
      [
        {
          maxAmount,
          allowedTokens,
          allowedRecipients,
        },
      ]
    );

    // Encode the function call
    const data = contract.interface.encodeFunctionData('setActionPolicy', [
      ipfsCid,
      encodedPolicy,
      version,
    ]);

    // Sign and send the transaction
    const txRequest = {
      to: contract.address,
      data,
    };

    // Estimate gas for the transaction
    const gasEstimate = await provider.estimateGas({
      ...txRequest,
      from: pkpAddress,
    });

    // Add gas parameters to the transaction
    const [baseFee, priorityFee] = await Promise.all([
      provider.getBlock('latest').then((block) => block.baseFeePerGas),
      provider.getGasPrice().then((gasPrice) => gasPrice.div(100).mul(5)), // 5% of current gas price
    ]);

    // Set maxFeePerGas to 2x current base fee + priority fee
    const maxFeePerGas = baseFee
      ? baseFee.mul(2).add(priorityFee)
      : priorityFee;

    const finalTx = {
      ...txRequest,
      type: 2, // EIP-1559 transaction
      chainId: (await provider.getNetwork()).chainId,
      nonce: await provider.getTransactionCount(pkpAddress),
      maxFeePerGas: maxFeePerGas.toHexString(),
      maxPriorityFeePerGas: priorityFee.toHexString(),
      gasLimit: gasEstimate.mul(120).div(100).toHexString(), // Add 20% buffer
    };

    const signature = await signCallback(
      ethers.utils.keccak256(ethers.utils.serializeTransaction(finalTx))
    );

    // Convert the signature to the format ethers.js expects
    const sig = ethers.utils.splitSignature(signature.signature);
    const signedTx = ethers.utils.serializeTransaction(finalTx, sig);

    // Send the signed transaction
    const sentTx = await provider.sendTransaction(signedTx);
    return sentTx;
  } catch (error) {
    throw new LitAgentError(
      LitAgentErrorType.TOOL_POLICY_REGISTRATION_FAILED,
      'Failed to register policy',
      { ipfsCid, policy, error }
    );
  }
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
  try {
    // Encode the function call
    const data = contract.interface.encodeFunctionData('removeActionPolicy', [
      ipfsCid,
    ]);

    // Sign and send the transaction
    const txRequest = {
      to: contract.address,
      data,
    };

    // Estimate gas for the transaction
    const gasEstimate = await provider.estimateGas({
      ...txRequest,
      from: pkpAddress,
    });

    // Add gas parameters to the transaction
    const [baseFee, priorityFee] = await Promise.all([
      provider.getBlock('latest').then((block) => block.baseFeePerGas),
      provider.getGasPrice().then((gasPrice) => gasPrice.div(100).mul(5)), // 5% of current gas price
    ]);

    // Set maxFeePerGas to 2x current base fee + priority fee
    const maxFeePerGas = baseFee
      ? baseFee.mul(2).add(priorityFee)
      : priorityFee;

    const finalTx = {
      ...txRequest,
      type: 2, // EIP-1559 transaction
      chainId: (await provider.getNetwork()).chainId,
      nonce: await provider.getTransactionCount(pkpAddress),
      maxFeePerGas: maxFeePerGas.toHexString(),
      maxPriorityFeePerGas: priorityFee.toHexString(),
      gasLimit: gasEstimate.mul(120).div(100).toHexString(), // Add 20% buffer
    };

    const signature = await signCallback(
      ethers.utils.keccak256(ethers.utils.serializeTransaction(finalTx))
    );

    // Convert the signature to the format ethers.js expects
    const sig = ethers.utils.splitSignature(signature.signature);
    const signedTx = ethers.utils.serializeTransaction(finalTx, sig);

    // Send the signed transaction
    const sentTx = await provider.sendTransaction(signedTx);
    return sentTx;
  } catch (error) {
    throw new LitAgentError(
      LitAgentErrorType.TOOL_POLICY_REGISTRATION_FAILED,
      'Failed to remove policy',
      { ipfsCid, error }
    );
  }
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
