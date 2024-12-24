import {
  LitAgent,
  LitAgentError,
  LitAgentErrorType,
} from '@lit-protocol/agent';
import { logger } from './utils/logger';
import { storage } from './utils/storage';
import { promptForConfig } from './prompts/config';
import { promptForUserIntent } from './prompts/intent';
import { promptForToolPermission } from './prompts/permissions';
import { collectMissingParams } from './prompts/parameters';
import { promptForToolPolicy } from './prompts/policy';
import inquirer from 'inquirer';

export class AgentCLI {
  private litAgent: LitAgent | null = null;

  async start() {
    await this.initializeLitAgent();
    await this.startInteractiveMode();
  }

  private async initializeLitAgent() {
    try {
      // Get configuration
      const config = await promptForConfig();

      this.litAgent = new LitAgent(
        config.litAuthPrivateKey,
        config.openAiApiKey,
        undefined,
        config.toolPolicyRegistryConfig
      );

      // Save the tool policy registry config if provided
      if (config.toolPolicyRegistryConfig) {
        storage.setToolPolicyRegistryConfig(config.toolPolicyRegistryConfig);
      }

      await this.litAgent.init();
      logger.success('Successfully initialized Lit Agent');
    } catch (error) {
      if (error instanceof LitAgentError) {
        switch (error.type) {
          case LitAgentErrorType.INSUFFICIENT_BALANCE: {
            const authWallet = storage.getWallet();
            if (!authWallet) throw error;

            logger.error(
              'Your Auth Wallet does not have enough Lit test tokens to mint the Agent Wallet.'
            );
            logger.info(
              `Please send Lit test tokens to your Auth Wallet: ${authWallet.address} before continuing.`
            );
            logger.log(
              'You can get test tokens from the following faucet: https://chronicle-yellowstone-faucet.getlit.dev/'
            );
            process.exit(1);
            break;
          }
          case LitAgentErrorType.WALLET_CREATION_FAILED: {
            logger.error(`Failed to create agent wallet: ${error.message}`);
            process.exit(1);
            break;
          }
          default: {
            logger.error(`Failed to initialize Lit Agent: ${error.message}`);
            process.exit(1);
            break;
          }
        }
      }
      logger.error(
        `Unexpected error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      process.exit(1);
    }
  }

  private async startInteractiveMode() {
    if (!this.litAgent) {
      throw new Error('LitAgent not initialized');
    }

    while (true) {
      // Get user intent
      const userIntent = await promptForUserIntent();

      // Analyze intent and match to tool
      const result = await this.litAgent.analyzeUserIntentAndMatchAction(
        userIntent
      );

      if (!result.matchedTool) {
        logger.info(result.analysis.reasoning);
        continue;
      }

      try {
        // Execute the tool with permission and parameter handling
        logger.info('Executing tool...');
        const executionResult = await this.litAgent.executeTool(
          result.matchedTool.ipfsCid,
          result.params.foundParams,
          {
            permissionCallback: async (tool) => {
              const shouldPermit = await promptForToolPermission(tool);
              if (!shouldPermit) {
                logger.info(
                  'Tool permission denied. Returning to main prompt...'
                );
              }
              return shouldPermit;
            },
            parameterCallback: async (tool, missingParams) => {
              const allParams = await collectMissingParams(tool, {
                foundParams: result.params.foundParams,
                missingParams,
              });
              return allParams;
            },
            setNewToolPolicyCallback: async (tool, currentPolicy) => {
              return promptForToolPolicy(tool, currentPolicy);
            },
            failedPolicyCallback: async (tool, params, policy, error) => {
              logger.error(`Policy validation failed: ${error.message}`);
              logger.info('Current parameters:');
              Object.entries(params).forEach(([key, value]) => {
                logger.log(`  ${key}: ${value}`);
              });

              const { shouldRetry } = await inquirer.prompt([
                {
                  type: 'confirm',
                  name: 'shouldRetry',
                  message:
                    'Would you like to provide new parameters that meet the policy requirements?',
                  default: true,
                },
              ]);

              if (shouldRetry) {
                // Reuse collectMissingParams to get all parameters again
                return collectMissingParams(tool, {
                  foundParams: {},
                  missingParams: Object.keys(params),
                });
              }

              return null;
            },
          }
        );

        if (!executionResult.success) {
          if (executionResult.reason) {
            logger.error(`Tool execution failed: ${executionResult.reason}`);
          }
          continue;
        }

        logger.success('Tool execution completed');
        logger.log(
          `Result: ${JSON.stringify(executionResult.result, null, 2)}`
        );
      } catch (error) {
        if (error instanceof LitAgentError) {
          switch (error.type) {
            case LitAgentErrorType.TOOL_EXECUTION_FAILED:
              logger.error(`Tool execution failed: ${error.message}`);
              break;
            case LitAgentErrorType.INVALID_PARAMETERS:
              logger.error(`Invalid parameters: ${error.message}`);
              break;
            case LitAgentErrorType.TOOL_VALIDATION_FAILED:
              logger.error(`Policy validation failed: ${error.message}`);
              break;
            default:
              logger.error(`Operation failed: ${error.message}`);
          }
        } else {
          logger.error(
            `Unexpected error: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
        continue;
      }
    }
  }
}
