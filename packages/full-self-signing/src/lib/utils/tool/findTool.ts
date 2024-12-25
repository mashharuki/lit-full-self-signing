import {
  listAvailableTools,
  type ToolInfo,
} from '@lit-protocol/fss-tool-registry';
import { LitAgentError, LitAgentErrorType } from '../../errors';

export async function findTool(ipfsCid: string): Promise<ToolInfo> {
  const tool = listAvailableTools().find((t) => t.ipfsCid === ipfsCid);
  if (!tool) {
    throw new LitAgentError(
      LitAgentErrorType.TOOL_EXECUTION_FAILED,
      'Tool not found',
      { ipfsCid }
    );
  }
  return tool;
}
