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

/**
 * Load capacity credit ID from storage
 */
export function loadCapacityCreditFromStorage(storage: Storage): string | null {
  try {
    return storage.getItem('capacityCreditId');
  } catch (error) {
    console.log('Capacity credit storage not initialized yet: ', error);
    return null;
  }
}

/**
 * Check if the current network requires capacity credits
 */
export function requiresCapacityCredit(litContracts: LitContracts): boolean {
  return (
    litContracts.network === LIT_NETWORK.DatilTest ||
    litContracts.network === LIT_NETWORK.Datil
  );
}

/**
 * Mint a new capacity credit NFT
 */
export async function mintCapacityCredit(
  litContracts: LitContracts,
  storage: Storage,
  {
    requestsPerKilosecond = 10,
    daysUntilUTCMidnightExpiration = 1,
  }: CapacityCreditMintOptions = {}
): Promise<string | null> {
  if (requiresCapacityCredit(litContracts)) {
    const capacityCreditInfo = await litContracts.mintCapacityCreditsNFT({
      requestsPerKilosecond,
      daysUntilUTCMidnightExpiration,
    });
    storage.setItem('capacityCreditId', capacityCreditInfo.capacityTokenIdStr);
    return capacityCreditInfo.capacityTokenIdStr;
  }
  return null;
}

/**
 * Get a capacity credit delegation auth signature
 */
export async function getCapacityCreditDelegationAuthSig(
  litNodeClient: LitNodeClientNodeJs,
  ethersWallet: ethers.Wallet,
  capacityCreditId: string,
  {
    delegateeAddresses,
    uses = '1',
    expiration = new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes from now
  }: CapacityCreditDelegationAuthSigOptions
): Promise<AuthSig> {
  const result = await litNodeClient.createCapacityDelegationAuthSig({
    dAppOwnerWallet: ethersWallet,
    capacityTokenId: capacityCreditId,
    delegateeAddresses,
    uses,
    expiration,
  });

  return result.capacityDelegationAuthSig;
}
