import { AgentSigner } from '@lit-protocol/agent-signer/dist/src/lib/agent-signer';
import type { ToolInfo } from '@lit-protocol/agent-tool-registry';

export async function checkToolPermission(
  signer: AgentSigner,
  tool: ToolInfo
): Promise<boolean> {
  const permittedActions = await signer.pkpListPermittedActions();
  return permittedActions.includes(tool.ipfsCid);
}
