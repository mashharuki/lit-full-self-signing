import { AgentSigner } from '@lit-protocol/agent-signer';
import type { ToolInfo } from '@lit-protocol/agent-tool-registry';
import { LitAgentError, LitAgentErrorType } from '../../errors';
import { checkToolPermission } from './checkToolPermission';
import { permitTool } from './permitTool';

export async function handleToolPermission(
  signer: AgentSigner,
  tool: ToolInfo,
  permissionCallback?: (tool: ToolInfo) => Promise<boolean>,
  setNewToolPolicyCallback?: (
    tool: ToolInfo,
    currentPolicy: any | null
  ) => Promise<{ usePolicy: boolean; policyValues?: any }>
): Promise<void> {
  const isPermitted = await checkToolPermission(signer, tool);
  if (!isPermitted) {
    if (permissionCallback) {
      const shouldPermit = await permissionCallback(tool);
      if (!shouldPermit) {
        throw new LitAgentError(
          LitAgentErrorType.TOOL_PERMISSION_FAILED,
          'Permission denied by user',
          { ipfsCid: tool.ipfsCid }
        );
      }
      await permitTool(signer, tool.ipfsCid);

      // After permitting the tool, prompt for policy configuration
      if (setNewToolPolicyCallback) {
        while (true) {
          const { usePolicy, policyValues } = await setNewToolPolicyCallback(
            tool,
            null
          );
          if (!usePolicy) {
            break;
          }
          if (policyValues) {
            try {
              await signer.setToolPolicy({
                ipfsCid: tool.ipfsCid,
                policy: policyValues,
                version: '1.0.0',
              });
              break;
            } catch (error) {
              let errorMessage = 'Failed to set tool policy';
              if (error instanceof Error) {
                errorMessage = error.message;
                const match = error.message.match(/\{.*\}/);
                if (match) {
                  try {
                    const parsed = JSON.parse(match[0]);
                    if (parsed.error?.message) {
                      errorMessage = parsed.error.message;
                    }
                  } catch {
                    // Ignore JSON parse errors as we'll use the original error message
                  }
                }
              }
              // Throw error to be caught by CLI for retry handling
              throw new LitAgentError(
                LitAgentErrorType.TOOL_POLICY_FAILED,
                errorMessage,
                { tool, policy: policyValues, originalError: error }
              );
            }
          }
        }
      }
    } else {
      throw new LitAgentError(
        LitAgentErrorType.TOOL_PERMISSION_FAILED,
        'Tool is not permitted',
        { ipfsCid: tool.ipfsCid }
      );
    }
  }
}
