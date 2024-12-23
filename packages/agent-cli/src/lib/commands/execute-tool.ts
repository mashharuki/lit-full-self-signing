import { AgentSigner } from '@lit-protocol/agent-signer';
import inquirer from 'inquirer';

import { logger } from '../utils/logger';
import { getPermittedTools, PermittedTool } from './list-tools';

async function selectTool(tools: PermittedTool[]): Promise<PermittedTool> {
  const choices = tools.map((tool) => ({
    name:
      tool.name === 'Unknown Tool'
        ? `Unknown Tool (${tool.base58Cid})`
        : `${tool.name} - ${tool.description}`,
    value: tool,
    short: tool.name,
  }));

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'tool',
      message: 'Select a tool to execute:',
      choices,
      pageSize: 20,
    },
  ]);

  return answer.tool;
}

export async function executeTool(agentSigner: AgentSigner): Promise<void> {
  logger.info('Fetching available tools...');

  try {
    const permittedTools = await getPermittedTools(agentSigner);

    if (permittedTools.length === 0) {
      logger.info('No tools are currently permitted for your agent wallet.');
      return;
    }

    // Sort tools to show registered tools first
    const sortedTools = [
      ...permittedTools.filter((tool) => tool.name !== 'Unknown Tool'),
      ...permittedTools.filter((tool) => tool.name === 'Unknown Tool'),
    ];

    const selectedTool = await selectTool(sortedTools);

    if (selectedTool.name === 'Unknown Tool') {
      logger.warn(
        'Selected tool is not registered in the Lit Agent Tool Registry'
      );
      logger.info(`Tool IPFS CID: ${selectedTool.base58Cid}`);
    } else {
      logger.success(`Selected tool: ${selectedTool.name}`);
      logger.info(`Description: ${selectedTool.description}`);
    }

    // TODO: Implement tool execution logic
    logger.info('Tool execution not yet implemented');
  } catch (error) {
    logger.error(
      'Failed to execute tool: ' +
        (error instanceof Error ? error.message : String(error))
    );
  }
}
