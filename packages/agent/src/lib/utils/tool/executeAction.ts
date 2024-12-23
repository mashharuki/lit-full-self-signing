import { AgentSigner } from '@lit-protocol/agent-signer';
import { LitAgentError, LitAgentErrorType } from '../../errors';

export async function executeAction(
  signer: AgentSigner,
  ipfsCid: string,
  params: Record<string, string>
): Promise<any> {
  try {
    return await signer.executeJs({
      ipfsId: ipfsCid,
      jsParams: params,
    });
  } catch (error) {
    throw new LitAgentError(
      LitAgentErrorType.TOOL_EXECUTION_FAILED,
      'Failed to execute tool',
      { ipfsCid, params, originalError: error }
    );
  }
}
