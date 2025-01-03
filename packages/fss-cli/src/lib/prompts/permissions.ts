import inquirer from 'inquirer';
import type { ToolInfo } from '@lit-protocol/fss-tool-registry';
import { logger } from '../utils/logger';

export async function promptForToolPermission(
  tool: ToolInfo
): Promise<boolean> {
  logger.warn('Tool Permission Required');
  logger.log(`Name: ${tool.name}`);
  logger.log(`Description: ${tool.description}`);
  logger.log(`IPFS CID: ${tool.ipfsCid}`);
  logger.log('Parameters:');
  tool.parameters.forEach((param) => {
    logger.log(`  - ${param.name}: ${param.description}`);
  });

  const { shouldPermit } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldPermit',
      message: 'Would you like to permit this tool for your agent wallet?',
      default: true,
    },
  ]);

  return shouldPermit;
}
