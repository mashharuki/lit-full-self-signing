import { AgentSigner } from '@lit-protocol/agent-signer';
import { LitAgentError, LitAgentErrorType } from '../../errors';

export async function executeAction(
  signer: AgentSigner,
  ipfsCid: string,
  params: Record<string, string>
): Promise<any> {
  try {
    const pkpInfo = AgentSigner.getPkpInfoFromStorage();
    if (!pkpInfo) {
      throw new LitAgentError(
        LitAgentErrorType.TOOL_EXECUTION_FAILED,
        'No PKP info found',
        { ipfsCid }
      );
    }

    return await signer.executeJs({
      ipfsId: ipfsCid,
      jsParams: {
        pkp: {
          ethAddress: pkpInfo.ethAddress,
          publicKey: pkpInfo.publicKey,
        },
        params,
      },
    });
  } catch (error) {
    throw new LitAgentError(
      LitAgentErrorType.TOOL_EXECUTION_FAILED,
      'Failed to execute tool',
      { ipfsCid, params, originalError: error }
    );
  }
}
