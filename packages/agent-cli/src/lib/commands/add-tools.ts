import inquirer from 'inquirer';
import { AgentSigner } from '@lit-protocol/agent-signer';
import { listAvailableTools } from '@lit-protocol/agent-tool-registry';
import { logger } from '../utils/logger';
import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';

async function promptForTools() {
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
  return selectedTools;
}

async function confirmTools(selectedTools: string[]): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Add the following tools to your agent?\n${selectedTools.join(
        '\n'
      )}`,
      default: true,
    },
  ]);
  return confirmed;
}

export async function addTools(agentSigner: AgentSigner): Promise<void> {
  while (true) {
    const selectedTools = await promptForTools();

    if (selectedTools.length === 0) {
      logger.info('No tools selected.');
      return;
    }

    logger.info(`Selected tools: ${selectedTools.join(', ')}`);

    const confirmed = await confirmTools(selectedTools);
    if (confirmed) {
      const tools = listAvailableTools();
      const selectedToolInfo = tools.filter((tool) =>
        selectedTools.includes(tool.name)
      );

      for (const tool of selectedToolInfo) {
        logger.info(`Registering ${tool.name}...`);
        try {
          await agentSigner.pkpPermitLitAction({
            ipfsCid: tool.ipfsCid,
            signingScopes: [AUTH_METHOD_SCOPE.SignAnything],
          });
          logger.success(`Successfully registered ${tool.name}`);
        } catch (error) {
          logger.error(`Failed to register ${tool.name}: ${error}`);
        }
      }
      return;
    }

    logger.info('Tool selection cancelled. Please select tools again.');
  }
}
