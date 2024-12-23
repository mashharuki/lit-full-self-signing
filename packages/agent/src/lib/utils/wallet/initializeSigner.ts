import { AgentSigner } from '@lit-protocol/agent-signer';
import { LitAgentError, LitAgentErrorType } from '../../errors';
import { createAgentWallet } from './createAgentWallet';
import { hasExistingAgentWallet } from './hasExistingAgentWallet';

export async function initializeSigner(
  litAuthPrivateKey: string
): Promise<AgentSigner> {
  try {
    const signer = await AgentSigner.create(litAuthPrivateKey);

    // Check for existing wallet and create if needed
    if (!hasExistingAgentWallet()) {
      await createAgentWallet(signer);
    }

    return signer;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Insufficient balance')) {
        throw new LitAgentError(
          LitAgentErrorType.INSUFFICIENT_BALANCE,
          'Insufficient balance to create agent wallet',
          { originalError: error }
        );
      }
    }
    throw new LitAgentError(
      LitAgentErrorType.INITIALIZATION_FAILED,
      'Failed to initialize signer',
      { originalError: error }
    );
  }
}
