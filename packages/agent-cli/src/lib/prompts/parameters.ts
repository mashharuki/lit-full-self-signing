import inquirer from 'inquirer';
import type { ToolInfo } from '@lit-protocol/agent-tool-registry';
import { logger } from '../utils/logger';
import { promptForChainConfig } from './config';

interface ToolParameters {
  foundParams: Record<string, string>;
  missingParams: string[];
}

export async function collectMissingParams(
  tool: ToolInfo,
  params: ToolParameters
): Promise<Record<string, any>> {
  while (true) {
    const allParams = { ...params.foundParams };

    if (params.missingParams.length > 0) {
      logger.warn('Some parameters are missing. Please provide them:');

      for (const paramName of params.missingParams) {
        const paramInfo = tool.parameters.find((p) => p.name === paramName);
        if (!paramInfo) {
          throw new Error(`Unknown parameter: ${paramName}`);
        }

        const { value } = await inquirer.prompt([
          {
            type: 'input',
            name: 'value',
            message: `Enter ${paramName} (${paramInfo.description}):`,
            validate: (input: string) => {
              if (!input.trim()) {
                return `${paramName} is required`;
              }
              return true;
            },
          },
        ]);

        allParams[paramName] = value.trim();
      }
    }

    // Get chain configuration
    const chainConfig = await promptForChainConfig();

    // Show all parameters for confirmation
    logger.info('Parameters to be used:');
    Object.entries(allParams).forEach(([key, value]) => {
      logger.log(`  ${key}: ${value}`);
    });
    logger.log('Chain configuration:');
    logger.log(`  RPC URL: ${chainConfig.rpcUrl}`);
    logger.log(`  Chain ID: ${chainConfig.chainId}`);

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Would you like to proceed with these parameters?',
        default: true,
      },
    ]);

    if (confirmed) {
      return {
        ...allParams,
        chainInfo: chainConfig,
      };
    }

    logger.info('Restarting parameter collection...');
    // Reset found parameters for missing ones to collect them again
    params.missingParams = [
      ...params.missingParams,
      ...Object.keys(allParams).filter((key) => !params.foundParams[key]),
    ];
  }
}
