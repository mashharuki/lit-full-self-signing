import { LitContracts } from '@lit-protocol/contracts-sdk';
import {
  AUTH_METHOD_SCOPE,
  AUTH_METHOD_SCOPE_VALUES,
  LIT_ABILITY,
  LIT_RPC,
} from '@lit-protocol/constants';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client-nodejs';
import { ethers } from 'ethers';

import type {
  AuthSig,
  ExecuteJsResponse,
  LIT_NETWORKS_KEYS,
  MintWithAuthResponse,
  SigResponse,
} from '@lit-protocol/types';

import { generateAuthSig } from '@lit-protocol/auth-helpers';
import { createSiweMessage } from '@lit-protocol/auth-helpers';
import { localStorage } from './localstorage';
import {
  CapacityCreditDelegationAuthSigOptions,
  CapacityCreditMintOptions,
  ExecuteJsParams,
  PkpInfo,
  PkpSessionSigsOptions,
} from './types';
import { LitActionResource, LitPKPResource } from '@lit-protocol/auth-helpers';

export class AgentSigner {
  private litNodeClient: LitNodeClientNodeJs | null = null;
  private ethersWallet: ethers.Wallet | null = null;
  private litContracts: LitContracts | null = null;
  private pkp: PkpInfo | null = null;
  private capacityCreditId: string | null = null;

  /**
   * Initialize the SDK
   * @param authKey The authentication key
   * @returns A Promise that resolves to a new LitClient instance
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

    agentSigner.litNodeClient = new LitNodeClientNodeJs({
      litNetwork,
      debug,
    });
    await agentSigner.litNodeClient.connect();

    agentSigner.ethersWallet = new ethers.Wallet(
      authPrivateKey,
      new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
    );

    agentSigner.litContracts = new LitContracts({
      signer: agentSigner.ethersWallet,
      network: litNetwork,
      debug,
    });
    await agentSigner.litContracts.connect();

    // Load PKP and capacity credit ID from storage
    try {
      const pkp = localStorage.getItem('pkp');
      if (pkp) {
        agentSigner.pkp = JSON.parse(
          pkp
        ) as MintWithAuthResponse<ethers.ContractReceipt>['pkp'];
      }

      const capacityCreditId = localStorage.getItem('capacityCreditId');
      if (capacityCreditId) {
        agentSigner.capacityCreditId = capacityCreditId;
      }
    } catch (error) {
      // If storage files don't exist yet, that's okay - we'll create them when needed
      console.log('Storage not initialized yet: ', error);
    }

    return agentSigner;
  }

  static getPkpInfoFromStorage(): PkpInfo | null {
    const pkp = localStorage.getItem('pkp');
    if (pkp) {
      return JSON.parse(pkp) as PkpInfo;
    }
    return null;
  }

  static getCapacityCreditIdFromStorage(): string | null {
    const capacityCreditId = localStorage.getItem('capacityCreditId');
    if (capacityCreditId) {
      return capacityCreditId;
    }
    return null;
  }

  private litNetworkRequiresCapacityCredit(): boolean {
    if (!this.litContracts) {
      throw new Error('Agent signer not properly initialized');
    }

    return (
      this.litContracts.network === LIT_NETWORK.DatilTest ||
      this.litContracts.network === LIT_NETWORK.Datil
    );
  }

  private async mintCapacityCredit({
    requestsPerKilosecond = 10,
    daysUntilUTCMidnightExpiration = 1,
  }: CapacityCreditMintOptions) {
    if (!this.litContracts || !this.ethersWallet) {
      throw new Error('Agent signer not properly initialized');
    }

    if (this.litNetworkRequiresCapacityCredit()) {
      const capacityCreditInfo = await this.litContracts.mintCapacityCreditsNFT(
        {
          requestsPerKilosecond,
          daysUntilUTCMidnightExpiration,
        }
      );
      localStorage.setItem(
        'capacityCreditId',
        capacityCreditInfo.capacityTokenIdStr
      );
      this.capacityCreditId = capacityCreditInfo.capacityTokenIdStr;
    }

    return this.capacityCreditId;
  }

  private async getCapacityCreditDelegationAuthSig({
    delegateeAddresses,
    uses = '1',
    expiration = new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes from now
  }: CapacityCreditDelegationAuthSigOptions) {
    if (!this.litNodeClient || !this.ethersWallet) {
      throw new Error('Agent signer not properly initialized');
    }

    if (!this.capacityCreditId) {
      throw new Error('Capacity credit ID not set');
    }

    const result = await this.litNodeClient.createCapacityDelegationAuthSig({
      dAppOwnerWallet: this.ethersWallet,
      capacityTokenId: this.capacityCreditId,
      delegateeAddresses,
      uses,
      expiration,
    });

    return result.capacityDelegationAuthSig;
  }

  private async getPkpSessionSigs({
    capacityDelegationAuthSig,
    expiration = new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes from now
  }: PkpSessionSigsOptions) {
    if (!this.litNodeClient || !this.ethersWallet || !this.pkp) {
      throw new Error('Agent signer not properly initialized or PKP not set');
    }

    // Store references after null check to appease TypeScript
    const wallet = this.ethersWallet;
    const litNodeClient = this.litNodeClient;

    return this.litNodeClient.getSessionSigs({
      chain: 'ethereum',
      expiration,
      capabilityAuthSigs: capacityDelegationAuthSig
        ? [capacityDelegationAuthSig]
        : undefined,
      resourceAbilityRequests: [
        {
          resource: new LitActionResource('*'),
          ability: LIT_ABILITY.LitActionExecution,
        },
        {
          resource: new LitPKPResource('*'),
          ability: LIT_ABILITY.PKPSigning,
        },
      ],
      authNeededCallback: async ({
        uri,
        expiration,
        resourceAbilityRequests,
      }) => {
        const toSign = await createSiweMessage({
          uri,
          expiration,
          resources: resourceAbilityRequests,
          walletAddress: await wallet.getAddress(),
          nonce: await litNodeClient.getLatestBlockhash(),
          litNodeClient,
        });

        return await generateAuthSig({
          signer: wallet,
          toSign,
        });
      },
    });
  }

  async disconnectLitNodeClient() {
    if (this.litNodeClient) {
      await this.litNodeClient.disconnect();
    }
  }

  async createWallet({
    requestsPerKilosecond,
    daysUntilUTCMidnightExpiration,
  }: CapacityCreditMintOptions = {}): Promise<{
    pkpInfo: PkpInfo;
    pkpMintTx: ethers.ContractTransaction;
    pkpMintReceipt: MintWithAuthResponse<ethers.ContractReceipt>;
  }> {
    if (!this.litContracts || !this.ethersWallet) {
      throw new Error('Agent signer not properly initialized');
    }

    const mintMetadata =
      await this.litContracts.pkpNftContractUtils.write.mint();

    // Save to storage
    localStorage.setItem('pkp', JSON.stringify(mintMetadata.pkp));
    this.pkp = mintMetadata.pkp;

    await this.mintCapacityCredit({
      requestsPerKilosecond,
      daysUntilUTCMidnightExpiration,
    });

    return {
      pkpInfo: mintMetadata.pkp,
      pkpMintTx: mintMetadata.tx,
      pkpMintReceipt: mintMetadata.res,
    };
  }

  async pkpPermitLitAction({
    ipfsCid,
    signingScopes = [AUTH_METHOD_SCOPE.SignAnything],
  }: {
    ipfsCid: string;
    signingScopes?: AUTH_METHOD_SCOPE_VALUES[];
  }) {
    if (!this.ethersWallet || !this.pkp || !this.litContracts) {
      throw new Error('Agent signer not properly initialized or PKP not set');
    }

    return this.litContracts.addPermittedAction({
      ipfsId: ipfsCid,
      authMethodScopes: signingScopes,
      pkpTokenId: this.pkp.tokenId,
    });
  }

  async pkpSign({ toSign }: { toSign: string }): Promise<SigResponse> {
    if (!this.litNodeClient || !this.pkp) {
      throw new Error('Agent signer not properly initialized or PKP not set');
    }

    let capacityDelegationAuthSig: AuthSig | undefined;
    if (this.litNetworkRequiresCapacityCredit()) {
      capacityDelegationAuthSig = await this.getCapacityCreditDelegationAuthSig(
        {
          delegateeAddresses: [this.pkp.ethAddress],
        }
      );
    }

    const sessionSigs = await this.getPkpSessionSigs({
      capacityDelegationAuthSig,
    });

    const signingResult = await this.litNodeClient.pkpSign({
      pubKey: this.pkp.publicKey,
      sessionSigs,
      toSign: ethers.utils.arrayify(toSign),
    });

    return signingResult;
  }

  async executeJs(params: ExecuteJsParams): Promise<ExecuteJsResponse> {
    if (!this.litNodeClient || !this.pkp) {
      throw new Error('Agent signer not properly initialized or PKP not set');
    }

    let capacityDelegationAuthSig: AuthSig | undefined;
    if (this.litNetworkRequiresCapacityCredit()) {
      capacityDelegationAuthSig = await this.getCapacityCreditDelegationAuthSig(
        {
          delegateeAddresses: [this.pkp.ethAddress],
        }
      );
    }

    const sessionSigs = await this.getPkpSessionSigs({
      capacityDelegationAuthSig,
    });

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
}
