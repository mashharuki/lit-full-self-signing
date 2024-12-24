import { ethers } from 'ethers';
import type { SigResponse } from '@lit-protocol/types';
import { SetToolPolicyOptions, ToolPolicy, RegisteredTools } from '../types';

export class ToolPolicyManager {
  private contract: ethers.Contract | null = null;

  constructor(
    private pkpAddress: string,
    private provider: ethers.providers.Provider,
    private signCallback: (toSign: string) => Promise<SigResponse>
  ) {}

  /**
   * Initialize the tool policy registry contract
   */
  async init(contractAddress: string) {
    this.contract = new ethers.Contract(
      contractAddress,
      [
        'function setActionPolicy(string calldata ipfsCid, bytes calldata policy, string calldata version) external',
        'function removeActionPolicy(string calldata ipfsCid) external',
        'function getActionPolicy(address pkp, string calldata ipfsCid) external view returns (bytes memory policy, string memory version)',
        'function getRegisteredActions(address pkp) external view returns (string[] memory ipfsCids, bytes[] memory policyData, string[] memory versions)',
      ],
      this.provider
    );
  }

  /**
   * Set or update a policy for a specific tool
   */
  async setToolPolicy(
    options: SetToolPolicyOptions
  ): Promise<ethers.ContractTransaction> {
    if (!this.contract) {
      throw new Error('Tool policy registry not initialized');
    }

    const { ipfsCid, policy, version } = options;

    // ABI encode the policy data
    const encodedPolicy = ethers.utils.defaultAbiCoder.encode(
      [typeof policy === 'object' ? 'tuple' : typeof policy],
      [policy]
    );

    // Encode the function call
    const data = this.contract.interface.encodeFunctionData('setActionPolicy', [
      ipfsCid,
      encodedPolicy,
      version,
    ]);

    // Sign and send the transaction
    const tx = {
      to: this.contract.address,
      data,
    };

    const signature = await this.signCallback(
      ethers.utils.keccak256(ethers.utils.serializeTransaction(tx))
    );

    // Send the signed transaction
    const signedTx = ethers.utils.serializeTransaction(tx, signature.signature);
    return this.provider.sendTransaction(signedTx);
  }

  /**
   * Remove a policy for a specific tool
   */
  async removeToolPolicy(ipfsCid: string): Promise<ethers.ContractTransaction> {
    if (!this.contract) {
      throw new Error('Tool policy registry not initialized');
    }

    // Encode the function call
    const data = this.contract.interface.encodeFunctionData(
      'removeActionPolicy',
      [ipfsCid]
    );

    // Sign and send the transaction
    const tx = {
      to: this.contract.address,
      data,
    };

    const signature = await this.signCallback(
      ethers.utils.keccak256(ethers.utils.serializeTransaction(tx))
    );

    // Send the signed transaction
    const signedTx = ethers.utils.serializeTransaction(tx, signature.signature);
    return this.provider.sendTransaction(signedTx);
  }

  /**
   * Get the policy for a specific tool
   */
  async getToolPolicy(ipfsCid: string): Promise<ToolPolicy> {
    if (!this.contract) {
      throw new Error('Tool policy registry not initialized');
    }

    const [policy, version] = await this.contract.getActionPolicy(
      this.pkpAddress,
      ipfsCid
    );
    return { policy, version };
  }

  /**
   * Get all registered tools and their policies
   */
  async getRegisteredTools(): Promise<RegisteredTools> {
    if (!this.contract) {
      throw new Error('Tool policy registry not initialized');
    }

    const [ipfsCids, policyData, versions] =
      await this.contract.getRegisteredActions(this.pkpAddress);
    return { ipfsCids, policyData, versions };
  }
}
