import { AgentSigner } from '@lit-protocol/agent-signer/dist/src/lib/agent-signer';
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
