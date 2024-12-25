import { AgentSigner } from '@lit-protocol/fss-signer';

export function hasExistingAgentWallet(): boolean {
  return !!AgentSigner.getPkpInfoFromStorage();
}
