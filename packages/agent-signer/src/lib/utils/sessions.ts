import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client-nodejs';
import { ethers } from 'ethers';
import type { AuthSig } from '@lit-protocol/types';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { generateAuthSig, createSiweMessage } from '@lit-protocol/auth-helpers';
import { LitActionResource, LitPKPResource } from '@lit-protocol/auth-helpers';
import { PkpSessionSigsOptions } from '../types';

/**
 * Get session signatures for PKP operations
 */
export async function getPkpSessionSigs(
  litNodeClient: LitNodeClientNodeJs,
  ethersWallet: ethers.Wallet,
  {
    capacityDelegationAuthSig,
    expiration = new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes from now
  }: PkpSessionSigsOptions
) {
  return litNodeClient.getSessionSigs({
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
        walletAddress: await ethersWallet.getAddress(),
        nonce: await litNodeClient.getLatestBlockhash(),
        litNodeClient,
      });

      return await generateAuthSig({
        signer: ethersWallet,
        toSign,
      });
    },
  });
}
