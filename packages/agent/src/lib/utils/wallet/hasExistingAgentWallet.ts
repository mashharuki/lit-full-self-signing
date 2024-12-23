import { AgentSigner } from '@lit-protocol/agent-signer';

export function hasExistingAgentWallet(): boolean {
  return !!AgentSigner.getPkpInfoFromStorage();
}
