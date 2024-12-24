import { LitContracts } from '@lit-protocol/contracts-sdk';
import { LIT_RPC } from '@lit-protocol/constants';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client-nodejs';
import { ethers } from 'ethers';
import type {
  ExecuteJsResponse,
  LIT_NETWORKS_KEYS,
  SigResponse,
} from '@lit-protocol/types';

import {
  CapacityCreditMintOptions,
  ExecuteJsParams,
  SetToolPolicyOptions,
  ToolPolicy,
  RegisteredTools,
  PkpInfo,
} from './types';
import { LocalStorageImpl } from './storage';
import {
  loadPkpFromStorage,
  createPkpWallet,
  permitLitAction,
  listPermittedActions,
  loadCapacityCreditFromStorage,
  requiresCapacityCredit,
  mintCapacityCredit,
  getCapacityCreditDelegationAuthSig,
  getPkpSessionSigs,
  createToolPolicyContract,
  setToolPolicy,
  removeToolPolicy,
  getToolPolicy,
  getRegisteredTools,
} from './utils';

export class AgentSigner {
  private litNodeClient: LitNodeClientNodeJs | null = null;
  private ethersWallet: ethers.Wallet | null = null;
  private litContracts: LitContracts | null = null;
  private toolPolicyContract: ethers.Contract | null = null;
  private pkpInfo: PkpInfo | null = null;

  private storage = new LocalStorageImpl();

  /**
   * Initialize the SDK
   */
  static async create(
    authPrivateKey: string,
    {
      litNetwork = LIT_NETWORK.DatilTest,
      debug = false,
    }: {
      litNetwork?: LIT_NETWORKS_KEYS;
      debug?: boolean;
    } = {}
  ): Promise<AgentSigner> {
    const agentSigner = new AgentSigner();

    // Initialize Lit Node Client
    agentSigner.litNodeClient = new LitNodeClientNodeJs({
      litNetwork,
      debug,
    });
    await agentSigner.litNodeClient.connect();

    // Initialize Ethers Wallet
    agentSigner.ethersWallet = new ethers.Wallet(
      authPrivateKey,
      new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
    );

    const ethersWalletBalance = await agentSigner.ethersWallet.getBalance();
    if (ethersWalletBalance.lt(ethers.utils.parseEther('0.01'))) {
      throw new Error(
        'Insufficient balance: Auth wallet does not have enough Lit test tokens'
      );
    }

    // Initialize Lit Contracts
    agentSigner.litContracts = new LitContracts({
      signer: agentSigner.ethersWallet,
      network: litNetwork,
      debug,
    });
    await agentSigner.litContracts.connect();

    // Load PKP from storage
    agentSigner.pkpInfo = loadPkpFromStorage(agentSigner.storage);

    return agentSigner;
  }

  /**
   * Create a new PKP wallet
   */
  async createWallet(options: CapacityCreditMintOptions = {}) {
    if (!this.litContracts) {
      throw new Error('Agent signer not properly initialized');
    }

    // Create PKP wallet
    const walletInfo = await createPkpWallet(this.litContracts, this.storage);
    this.pkpInfo = walletInfo.pkpInfo;

    // Mint capacity credit if needed
    if (this.litContracts) {
      await mintCapacityCredit(this.litContracts, this.storage, options);
    }

    return walletInfo;
  }

  /**
   * Sign data with the PKP
   */
  async pkpSign({ toSign }: { toSign: string }): Promise<SigResponse> {
    if (!this.litNodeClient || !this.litContracts || !this.ethersWallet) {
      throw new Error('Agent signer not properly initialized');
    }

    if (!this.pkpInfo) {
      throw new Error('PKP not set');
    }

    let capacityDelegationAuthSig;
    if (requiresCapacityCredit(this.litContracts)) {
      const capacityCreditId = loadCapacityCreditFromStorage(this.storage);
      if (!capacityCreditId) {
        throw new Error('Capacity credit not found');
      }

      capacityDelegationAuthSig = await getCapacityCreditDelegationAuthSig(
        this.litNodeClient,
        this.ethersWallet,
        capacityCreditId,
        {
          delegateeAddresses: [this.pkpInfo.ethAddress],
        }
      );
    }

    const sessionSigs = await getPkpSessionSigs(
      this.litNodeClient,
      this.ethersWallet,
      {
        capacityDelegationAuthSig,
      }
    );

    return this.litNodeClient.pkpSign({
      pubKey: this.pkpInfo.publicKey,
      sessionSigs,
      toSign: ethers.utils.arrayify(toSign),
    });
  }

  /**
   * Execute JavaScript code
   */
  async executeJs(params: ExecuteJsParams): Promise<ExecuteJsResponse> {
    if (!this.litNodeClient || !this.litContracts || !this.ethersWallet) {
      throw new Error('Agent signer not properly initialized');
    }

    if (!this.pkpInfo) {
      throw new Error('PKP not set');
    }

    let capacityDelegationAuthSig;
    if (requiresCapacityCredit(this.litContracts)) {
      const capacityCreditId = loadCapacityCreditFromStorage(this.storage);
      if (!capacityCreditId) {
        throw new Error('Capacity credit not found');
      }

      capacityDelegationAuthSig = await getCapacityCreditDelegationAuthSig(
        this.litNodeClient,
        this.ethersWallet,
        capacityCreditId,
        {
          delegateeAddresses: [this.pkpInfo.ethAddress],
        }
      );
    }

    const sessionSigs = await getPkpSessionSigs(
      this.litNodeClient,
      this.ethersWallet,
      {
        capacityDelegationAuthSig,
      }
    );

    try {
      return this.litNodeClient.executeJs({
        sessionSigs,
        ...params,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to execute JS: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Initialize the tool policy registry
   */
  async initToolPolicyRegistry(contractAddress: string) {
    if (!this.ethersWallet) {
      throw new Error('Agent signer not properly initialized');
    }

    this.toolPolicyContract = createToolPolicyContract(
      contractAddress,
      this.ethersWallet.provider
    );
  }

  /**
   * Set or update a policy for a specific tool
   */
  async setToolPolicy(
    options: SetToolPolicyOptions
  ): Promise<ethers.ContractTransaction> {
    if (!this.toolPolicyContract || !this.ethersWallet || !this.pkpInfo) {
      throw new Error('Tool policy manager not initialized');
    }

    return setToolPolicy(
      this.toolPolicyContract,
      this.pkpInfo.ethAddress,
      (toSign: string) => this.pkpSign({ toSign }),
      this.ethersWallet.provider,
      options
    );
  }

  /**
   * Remove a policy for a specific tool
   */
  async removeToolPolicy(ipfsCid: string): Promise<ethers.ContractTransaction> {
    if (!this.toolPolicyContract || !this.ethersWallet || !this.pkpInfo) {
      throw new Error('Tool policy manager not initialized');
    }

    return removeToolPolicy(
      this.toolPolicyContract,
      this.pkpInfo.ethAddress,
      (toSign: string) => this.pkpSign({ toSign }),
      this.ethersWallet.provider,
      ipfsCid
    );
  }

  /**
   * Get the policy for a specific tool
   */
  async getToolPolicy(ipfsCid: string): Promise<ToolPolicy> {
    if (!this.toolPolicyContract || !this.pkpInfo) {
      throw new Error('Tool policy manager not initialized');
    }

    return getToolPolicy(
      this.toolPolicyContract,
      this.pkpInfo.ethAddress,
      ipfsCid
    );
  }

  /**
   * Get all registered tools and their policies
   */
  async getRegisteredTools(): Promise<RegisteredTools> {
    if (!this.toolPolicyContract || !this.pkpInfo) {
      throw new Error('Tool policy manager not initialized');
    }

    return getRegisteredTools(this.toolPolicyContract, this.pkpInfo.ethAddress);
  }

  /**
   * Disconnect from the Lit Node Client
   */
  async disconnectLitNodeClient() {
    if (this.litNodeClient) {
      await this.litNodeClient.disconnect();
    }
  }
}
