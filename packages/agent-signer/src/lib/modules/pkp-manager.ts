import { LitContracts } from '@lit-protocol/contracts-sdk';
import { ethers } from 'ethers';
import type { MintWithAuthResponse } from '@lit-protocol/types';
import {
  AUTH_METHOD_SCOPE,
  AUTH_METHOD_SCOPE_VALUES,
} from '@lit-protocol/constants';
import { PkpInfo } from '../types';
import { LocalStorage } from '../storage';

export class PKPManager {
  private pkp: PkpInfo | null = null;

  constructor(
    private litContracts: LitContracts,
    private storage: LocalStorage
  ) {
    // Load PKP from storage
    try {
      const pkp = this.storage.getItem('pkp');
      if (pkp) {
        this.pkp = JSON.parse(pkp) as PkpInfo;
      }
    } catch (error) {
      console.log('PKP storage not initialized yet: ', error);
    }
  }

  get pkpInfo(): PkpInfo | null {
    return this.pkp;
  }

  get isInitialized(): boolean {
    return this.pkp !== null;
  }

  /**
   * Create a new PKP wallet
   */
  async createWallet(): Promise<{
    pkpInfo: PkpInfo;
    pkpMintTx: ethers.ContractTransaction;
    pkpMintReceipt: MintWithAuthResponse<ethers.ContractReceipt>;
  }> {
    const mintMetadata =
      await this.litContracts.pkpNftContractUtils.write.mint();

    // Save to storage
    this.storage.setItem('pkp', JSON.stringify(mintMetadata.pkp));
    this.pkp = mintMetadata.pkp;

    return {
      pkpInfo: mintMetadata.pkp,
      pkpMintTx: mintMetadata.tx,
      pkpMintReceipt: mintMetadata.res,
    };
  }

  /**
   * Permit a Lit Action to be executed by this PKP
   */
  async permitLitAction({
    ipfsCid,
    signingScopes = [AUTH_METHOD_SCOPE.SignAnything],
  }: {
    ipfsCid: string;
    signingScopes?: AUTH_METHOD_SCOPE_VALUES[];
  }) {
    if (!this.pkp) {
      throw new Error('PKP not initialized');
    }

    return this.litContracts.addPermittedAction({
      ipfsId: ipfsCid,
      authMethodScopes: signingScopes,
      pkpTokenId: this.pkp.tokenId,
    });
  }

  /**
   * List all permitted Lit Actions for this PKP
   */
  async listPermittedActions() {
    if (!this.pkp) {
      throw new Error('PKP not initialized');
    }

    return this.litContracts.pkpPermissionsContractUtils.read.getPermittedActions(
      this.pkp.tokenId
    );
  }
}
