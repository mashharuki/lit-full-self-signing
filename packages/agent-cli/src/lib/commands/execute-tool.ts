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

async function collectParameters(
  tool: PermittedTool
): Promise<Record<string, string>> {
  if (tool.name === 'Unknown Tool' || tool.parameters.length === 0) {
    logger.warn('No parameters defined for this tool');
    return {};
  }

  const parameters: Record<string, string> = {};

  // Collect each parameter one at a time to avoid type issues
  for (const param of tool.parameters) {
    const { value } = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message: `Enter ${param.name} (${param.description}):`,
        validate: (input: string) => {
          if (!input.trim()) {
            return `${param.name} is required`;
          }
          return true;
        },
      },
    ]);

    parameters[param.name] = value;
  }

  return parameters;
}

function formatResponse(response: unknown): string {
  try {
    return JSON.stringify(response, null, 2);
  } catch {
    return String(response);
  }
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

      // For unknown tools, we can still try to execute them with empty parameters
      logger.info('Attempting to execute unknown tool...');
      const result = await agentSigner.executeJs({
        ipfsId: selectedTool.ipfsCid,
        jsParams: {},
      });

      logger.success('Tool execution completed');
      logger.log(`Response:\n${formatResponse(result)}`);
    } else {
      logger.success(`Selected tool: ${selectedTool.name}`);
      logger.info(`Description: ${selectedTool.description}`);

      // Collect parameters for the tool
      const parameters = await collectParameters(selectedTool);
      logger.info('Collected parameters:');
      Object.entries(parameters).forEach(([key, value]) => {
        logger.log(`  ${key}: ${value}`);
      });

      // Execute the tool with the collected parameters
      logger.info('Executing tool...');
      const result = await agentSigner.executeJs({
        ipfsId: selectedTool.ipfsCid,
        jsParams: parameters,
      });

      logger.success('Tool execution completed');
      logger.log(`Response:\n${formatResponse(result)}`);
    }
  } catch (error) {
    logger.error(
      'Failed to execute tool: ' +
        (error instanceof Error ? error.message : String(error))
    );
  }
}
