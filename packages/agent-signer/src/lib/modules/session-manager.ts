import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client-nodejs';
import { ethers } from 'ethers';
import type { AuthSig } from '@lit-protocol/types';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { generateAuthSig, createSiweMessage } from '@lit-protocol/auth-helpers';
import { LitActionResource, LitPKPResource } from '@lit-protocol/auth-helpers';
import { PkpSessionSigsOptions } from '../types';

export class SessionManager {
  constructor(
    private litNodeClient: LitNodeClientNodeJs,
    private ethersWallet: ethers.Wallet
  ) {}

  /**
   * Get session signatures for PKP operations
   */
  async getPkpSessionSigs({
    capacityDelegationAuthSig,
    expiration = new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes from now
  }: PkpSessionSigsOptions) {
    // Store references to appease TypeScript
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
}
