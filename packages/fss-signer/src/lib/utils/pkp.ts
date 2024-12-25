import { LitContracts } from '@lit-protocol/contracts-sdk';
import { ethers } from 'ethers';
import type { MintWithAuthResponse } from '@lit-protocol/types';
import {
  AUTH_METHOD_SCOPE,
  AUTH_METHOD_SCOPE_VALUES,
} from '@lit-protocol/constants';
import { PkpInfo } from '../types';
import { Storage } from '../storage';

/**
 * Load PKP info from storage
 */
export function loadPkpFromStorage(storage: Storage): PkpInfo | null {
  try {
    const pkp = storage.getItem('pkp');
    if (pkp) {
      return JSON.parse(pkp) as PkpInfo;
    }
  } catch (error) {
    console.log('PKP storage not initialized yet: ', error);
  }
  return null;
}

/**
 * Create a new PKP wallet
 */
export async function createPkpWallet(
  litContracts: LitContracts,
  storage: Storage
): Promise<{
  pkpInfo: PkpInfo;
  pkpMintTx: ethers.ContractTransaction;
  pkpMintReceipt: MintWithAuthResponse<ethers.ContractReceipt>;
}> {
  const mintMetadata = await litContracts.pkpNftContractUtils.write.mint();

  // Save to storage
  storage.setItem('pkp', JSON.stringify(mintMetadata.pkp));

  return {
    pkpInfo: mintMetadata.pkp,
    pkpMintTx: mintMetadata.tx,
    pkpMintReceipt: mintMetadata.res,
  };
}

/**
 * Permit a Lit Action to be executed by a PKP
 */
export async function permitLitAction(
  litContracts: LitContracts,
  pkpInfo: PkpInfo,
  {
    ipfsCid,
    signingScopes = [AUTH_METHOD_SCOPE.SignAnything],
  }: {
    ipfsCid: string;
    signingScopes?: AUTH_METHOD_SCOPE_VALUES[];
  }
) {
  return litContracts.addPermittedAction({
    ipfsId: ipfsCid,
    authMethodScopes: signingScopes,
    pkpTokenId: pkpInfo.tokenId,
  });
}

/**
 * List all permitted Lit Actions for a PKP
 */
export async function listPermittedActions(
  litContracts: LitContracts,
  pkpInfo: PkpInfo
) {
  return litContracts.pkpPermissionsContractUtils.read.getPermittedActions(
    pkpInfo.tokenId
  );
}
