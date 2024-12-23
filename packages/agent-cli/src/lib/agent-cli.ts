import {
  LitAgent,
  LitAgentError,
  LitAgentErrorType,
} from '@lit-protocol/agent';

import { logger } from './utils/logger';
import { storage } from './utils/storage';
import { getAuthPrivateKey } from './wallet';
import { promptForOpenAIKey } from './prompts/config';
import { promptForUserIntent } from './prompts/intent';
import { promptForToolPermission } from './prompts/permissions';
import { collectMissingParams } from './prompts/parameters';

export class AgentCLI {
  private litAgent: LitAgent | null = null;

  async start() {
    await this.initializeLitAgent();
    await this.startInteractiveMode();
  }

  private async initializeLitAgent() {
    const privateKey = await getAuthPrivateKey();
    const openAiKey = await promptForOpenAIKey();

    this.litAgent = new LitAgent(privateKey, openAiKey);

    try {
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
      logger.error(`Unexpected error: ${error}`);
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

      // Collect any missing parameters
      try {
        const allParams = await collectMissingParams(
          result.matchedTool,
          result.params
        );

        // Execute the tool
        logger.info('Executing tool...');
        const executionResult =
          await this.litAgent.executeToolWithPermissionCheck(
            result.matchedTool.ipfsCid,
            allParams,
            async (tool) => {
              const shouldPermit = await promptForToolPermission(tool);
              if (!shouldPermit) {
                logger.info(
                  'Tool permission denied. Returning to main prompt...'
                );
              }
              return shouldPermit;
            }
          );
        logger.success('Tool execution completed');
        logger.log(`Result: ${JSON.stringify(executionResult, null, 2)}`);
      } catch (error) {
        if (error instanceof LitAgentError) {
          switch (error.type) {
            case LitAgentErrorType.TOOL_EXECUTION_FAILED:
              logger.error(`Tool execution failed: ${error.message}`);
              break;
            case LitAgentErrorType.TOOL_PERMISSION_FAILED:
              // Permission denial is already handled in the callback
              break;
            case LitAgentErrorType.INVALID_PARAMETERS:
              logger.error(`Invalid parameters: ${error.message}`);
              break;
            default:
              logger.error(`Operation failed: ${error.message}`);
          }
        } else {
          logger.error(`Unexpected error: ${error}`);
        }
        continue;
      }
    }
  }
}
