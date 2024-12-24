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

    // Estimate gas for the transaction
    let gasEstimate;
    try {
      gasEstimate = await provider.estimateGas({
        ...tx,
        from: pkpAddress,
      });
    } catch (error) {
      throw new LitAgentError(
        LitAgentErrorType.TOOL_POLICY_REGISTRATION_FAILED,
        `Failed to estimate gas: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { ipfsCid, policy, error }
      );
    }

    // Add gas parameters to the transaction
    const finalTx = {
      ...tx,
      gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
    };

    let signature;
    try {
      signature = await signCallback(
        ethers.utils.keccak256(ethers.utils.serializeTransaction(finalTx))
      );
    } catch (error) {
      throw new LitAgentError(
        LitAgentErrorType.TOOL_POLICY_REGISTRATION_FAILED,
        `Failed to sign transaction: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { ipfsCid, policy, error }
      );
    }

    // Send the signed transaction
    try {
      const signedTx = ethers.utils.serializeTransaction(
        finalTx,
        signature.signature
      );
      return await provider.sendTransaction(signedTx);
    } catch (error) {
      throw new LitAgentError(
        LitAgentErrorType.TOOL_POLICY_REGISTRATION_FAILED,
        `Failed to send transaction: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { ipfsCid, policy, error }
      );
    }
  } catch (error) {
    // If it's already a LitAgentError, rethrow it
    if (error instanceof LitAgentError) {
      throw error;
    }
    // Otherwise wrap it
    throw new LitAgentError(
      LitAgentErrorType.TOOL_POLICY_REGISTRATION_FAILED,
      `Failed to set tool policy: ${
        error instanceof Error ? error.message : String(error)
      }`,
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
    const tx = {
      to: contract.address,
      data,
    };

    // Estimate gas for the transaction
    let gasEstimate;
    try {
      gasEstimate = await provider.estimateGas({
        ...tx,
        from: pkpAddress,
      });
    } catch (error) {
      throw new LitAgentError(
        LitAgentErrorType.TOOL_POLICY_REGISTRATION_FAILED,
        `Failed to estimate gas: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { ipfsCid, error }
      );
    }

    // Add gas parameters to the transaction
    const finalTx = {
      ...tx,
      gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
    };

    let signature;
    try {
      signature = await signCallback(
        ethers.utils.keccak256(ethers.utils.serializeTransaction(finalTx))
      );
    } catch (error) {
      throw new LitAgentError(
        LitAgentErrorType.TOOL_POLICY_REGISTRATION_FAILED,
        `Failed to sign transaction: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { ipfsCid, error }
      );
    }

    // Send the signed transaction
    try {
      const signedTx = ethers.utils.serializeTransaction(
        finalTx,
        signature.signature
      );
      return await provider.sendTransaction(signedTx);
    } catch (error) {
      throw new LitAgentError(
        LitAgentErrorType.TOOL_POLICY_REGISTRATION_FAILED,
        `Failed to send transaction: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { ipfsCid, error }
      );
    }
  } catch (error) {
    // If it's already a LitAgentError, rethrow it
    if (error instanceof LitAgentError) {
      throw error;
    }
    // Otherwise wrap it
    throw new LitAgentError(
      LitAgentErrorType.TOOL_POLICY_REGISTRATION_FAILED,
      `Failed to remove tool policy: ${
        error instanceof Error ? error.message : String(error)
      }`,
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
