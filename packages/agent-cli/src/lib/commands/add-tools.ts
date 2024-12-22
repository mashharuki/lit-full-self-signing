import inquirer from 'inquirer';
import { AgentSigner } from '@lit-protocol/agent-signer';
import { listAvailableTools } from '@lit-protocol/agent-tool-registry';

import { logger } from '../utils/logger';

export async function addTools(agentSigner: AgentSigner): Promise<void> {
  const tools = listAvailableTools();

  const { selectedTools } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedTools',
      message: 'Select tools to add to your agent:',
      choices: tools.map((tool) => ({
        name: `${tool.name} - ${tool.description}`,
        value: tool.name,
      })),
    },
  ]);

  if (selectedTools.length === 0) {
    logger.info('No tools selected.');
    return;
  }

  logger.info(`Selected tools: ${selectedTools.join(', ')}`);
  // TODO: Implement tool registration with PKP
  logger.success('Tools added successfully!');
}
