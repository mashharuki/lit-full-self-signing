import { AgentSigner } from '@lit-protocol/agent-signer/dist/src/lib/agent-signer';

export function hasExistingAgentWallet(): boolean {
  return !!AgentSigner.getPkpInfoFromStorage();
}
