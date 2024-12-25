import { AgentSigner } from '@lit-protocol/fss-signer';
import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';
import { LitAgentError, LitAgentErrorType } from '../../errors';

export async function permitTool(
  signer: AgentSigner,
  ipfsCid: string
): Promise<void> {
  try {
    await signer.pkpPermitLitAction({
      ipfsCid,
      signingScopes: [AUTH_METHOD_SCOPE.SignAnything],
    });
  } catch (error) {
    throw new LitAgentError(
      LitAgentErrorType.TOOL_PERMISSION_FAILED,
      'Failed to permit tool',
      { ipfsCid, originalError: error }
    );
  }
}
