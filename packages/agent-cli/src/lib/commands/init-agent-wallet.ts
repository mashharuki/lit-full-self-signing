import { AgentSigner } from '@lit-protocol/agent-signer';
import { logger } from '../utils/logger';
import { storage } from '../utils/storage';

export async function initAgentWallet(
  agentSigner: AgentSigner | null = null
): Promise<AgentSigner | null> {
  if (agentSigner === null) {
    const existingWallet = storage.getWallet();
    if (existingWallet === null) {
      logger.error(
        'No Agent Auth Wallet found. Please initialize an Agent Auth Wallet first.'
      );
      return null;
    }
    agentSigner = await AgentSigner.create(existingWallet.privateKey);
  }

  const pkpInfo = await agentSigner.createWallet();
  storage.storePkpInfo(pkpInfo.pkpInfo);
  logger.success('Agent Wallet initialization completed successfully!');
  return agentSigner;
}
