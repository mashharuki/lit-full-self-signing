import { AgentSigner, ExecuteJsParams } from '@lit-protocol/agent-signer';
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

    const execParams: ExecuteJsParams = {
      ipfsId: ipfsCid,
      jsParams: {
        pkp: {
          ethAddress: pkpInfo.ethAddress,
          publicKey: pkpInfo.publicKey,
        },
        params,
      },
    };

    return await signer.executeJs(execParams);
  } catch (error) {
    throw new LitAgentError(
      LitAgentErrorType.TOOL_EXECUTION_FAILED,
      'Failed to execute tool',
      { ipfsCid, params, originalError: error }
    );
  }
}
