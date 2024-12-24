import { LitContracts } from '@lit-protocol/contracts-sdk';
import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client-nodejs';
import { ethers } from 'ethers';
import type { AuthSig } from '@lit-protocol/types';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { Storage } from '../storage';
import {
  CapacityCreditMintOptions,
  CapacityCreditDelegationAuthSigOptions,
} from '../types';

export class CapacityCreditManager {
  private capacityCreditId: string | null = null;

  constructor(
    private litContracts: LitContracts,
    private litNodeClient: LitNodeClientNodeJs,
    private ethersWallet: ethers.Wallet,
    private storage: Storage
  ) {
    // Load capacity credit ID from storage
    try {
      const capacityCreditId = this.storage.getItem('capacityCreditId');
      if (capacityCreditId) {
        this.capacityCreditId = capacityCreditId;
      }
    } catch (error) {
      console.log('Capacity credit storage not initialized yet: ', error);
    }
  }

  get isInitialized(): boolean {
    return this.capacityCreditId !== null;
  }

  get creditId(): string | null {
    return this.capacityCreditId;
  }

  /**
   * Check if the current network requires capacity credits
   */
  requiresCapacityCredit(): boolean {
    return (
      this.litContracts.network === LIT_NETWORK.DatilTest ||
      this.litContracts.network === LIT_NETWORK.Datil
    );
  }

  /**
   * Mint a new capacity credit NFT
   */
  async mintCapacityCredit({
    requestsPerKilosecond = 10,
    daysUntilUTCMidnightExpiration = 1,
  }: CapacityCreditMintOptions = {}) {
    if (this.requiresCapacityCredit()) {
      const capacityCreditInfo = await this.litContracts.mintCapacityCreditsNFT(
        {
          requestsPerKilosecond,
          daysUntilUTCMidnightExpiration,
        }
      );
      this.storage.setItem(
        'capacityCreditId',
        capacityCreditInfo.capacityTokenIdStr
      );
      this.capacityCreditId = capacityCreditInfo.capacityTokenIdStr;
    }

    return this.capacityCreditId;
  }

  /**
   * Get a capacity credit delegation auth signature
   */
  async getDelegationAuthSig({
    delegateeAddresses,
    uses = '1',
    expiration = new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes from now
  }: CapacityCreditDelegationAuthSigOptions): Promise<AuthSig> {
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
}
