import { AgentSigner } from '@lit-protocol/fss-signer';
import { LitAgentError, LitAgentErrorType } from '../../errors';

export async function createAgentWallet(signer: AgentSigner): Promise<void> {
  try {
    await signer.createWallet();
  } catch (error) {
    throw new LitAgentError(
      LitAgentErrorType.WALLET_CREATION_FAILED,
      'Failed to create agent wallet',
      { originalError: error }
    );
  }
}
