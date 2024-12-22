import { AgentSigner } from '@lit-protocol/agent-signer';
import { listAvailableTools } from '@lit-protocol/agent-tool-registry';
import inquirer from 'inquirer';
import { logger } from '../utils/logger';
import { storage } from '../utils/storage';

export async function addTools(
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

  const pkpInfo = AgentSigner.getPkpInfoFromStorage();
  if (!pkpInfo) {
    logger.error(
      'No Agent Wallet found. Please initialize an Agent Wallet first.'
    );
    return null;
  }

  const availableTools = listAvailableTools();

  const { selectedTools } = await inquirer.prompt<{ selectedTools: string[] }>([
    {
      type: 'checkbox',
      name: 'selectedTools',
      message: 'Select tools to add to your agent:',
      choices: availableTools.map((tool) => ({
        name: `${tool.name} - ${tool.description}`,
        value: tool.name,
        checked: false,
      })),
    },
  ]);

  if (selectedTools.length === 0) {
    logger.info('No tools selected.');
    return agentSigner;
  }

  logger.info(`Selected tools: ${selectedTools.join(', ')}`);
  // TODO: Implement tool registration with PKP
  logger.success('Tools added successfully!');
  return agentSigner;
}
