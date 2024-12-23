import { Command } from 'commander';
import { AgentSigner } from '@lit-protocol/agent-signer';
import { LitAgent } from '@lit-protocol/agent';
import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';
import { logger } from './utils/logger';
import { storage } from './utils/storage';
import { getAuthPrivateKey } from './wallet';
import { promptForOpenAIKey } from './prompts/config';
import { promptForUserIntent } from './prompts/intent';
import { promptForToolPermission } from './prompts/permissions';
import { collectMissingParams } from './prompts/parameters';

export class AgentCLI {
  private program: Command;
  private agentSigner: AgentSigner | null = null;
  private litAgent: LitAgent | null = null;

  constructor() {
    this.program = new Command();
    this.setupProgram();
  }

  private setupProgram() {
    this.program.exitOverride();

    this.program
      .name('agent-cli')
      .description('Interactive CLI for Lit Agent')
      .version('0.1.0')
      .action(async () => {
        logger.log('Welcome to Lit Agent CLI');
        await this.initialize();
        await this.startInteractiveMode();
      });
  }

  private async initialize() {
    // Initialize AgentSigner first
    await this.initializeAgentSigner();

    // Then initialize LitAgent with OpenAI key
    await this.initializeLitAgent();
  }

  private async initializeAgentSigner() {
    const pkpInfo = AgentSigner.getPkpInfoFromStorage();
    if (!pkpInfo) {
      logger.info('No agent wallet found. Initializing a new one...');
      const privateKey = await getAuthPrivateKey();

      try {
        this.agentSigner = await AgentSigner.create(privateKey);
        await this.agentSigner.createWallet();
        logger.success('Agent wallet initialized successfully!');
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Insufficient balance')
        ) {
          const authWallet = storage.getWallet();
          if (!authWallet) throw error;

          logger.error(
            'Your Auth Wallet does not have enough Lit test tokens to mint the Agent Wallet.'
          );
          logger.info(
            `Please send Lit test tokens to your Auth Wallet: ${authWallet.address} before continuing.`
          );
          logger.info(
            'You can get test tokens from the following faucet: https://chronicle-yellowstone-faucet.getlit.dev/'
          );
          process.exit(1);
        }
        logger.error('Failed to initialize agent wallet: ' + error);
        process.exit(1);
      }
    } else {
      const existingWallet = storage.getWallet();
      if (!existingWallet) {
        logger.error(
          'Found agent wallet but missing auth wallet. Please delete .lit-agent-storage and try again.'
        );
        process.exit(1);
      }

      try {
        this.agentSigner = await AgentSigner.create(existingWallet.privateKey);
        logger.success('Successfully loaded existing agent wallet.');
      } catch (error) {
        logger.error('Failed to load existing agent wallet: ' + error);
        process.exit(1);
      }
    }
  }

  private async initializeLitAgent() {
    if (!this.agentSigner) {
      throw new Error('AgentSigner must be initialized before LitAgent');
    }

    const openAiKey = await promptForOpenAIKey();
    this.litAgent = new LitAgent(this.agentSigner, openAiKey);
    logger.success('Successfully initialized Lit Agent');
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

      // Check permissions and prompt if needed
      if (!result.isPermitted) {
        const shouldPermit = await promptForToolPermission(result.matchedTool);
        if (!shouldPermit) {
          logger.info('Tool permission denied. Returning to main prompt...');
          continue;
        }

        try {
          await this.agentSigner!.pkpPermitLitAction({
            ipfsCid: result.matchedTool.ipfsCid,
            signingScopes: [AUTH_METHOD_SCOPE.SignAnything],
          });
          logger.success(
            `Successfully permitted tool: ${result.matchedTool.name}`
          );
        } catch (error) {
          logger.error(`Failed to permit tool: ${error}`);
          continue;
        }
      }

      // Collect any missing parameters
      try {
        const allParams = await collectMissingParams(
          result.matchedTool,
          result.params
        );

        // Execute the tool
        logger.info('Executing tool...');
        const executionResult = await this.agentSigner!.executeJs({
          ipfsId: result.matchedTool.ipfsCid,
          jsParams: allParams,
        });
        logger.success('Tool execution completed');
        logger.log(`Result: ${JSON.stringify(executionResult, null, 2)}`);
      } catch (error) {
        logger.error(`Operation failed: ${error}`);
        continue;
      }
    }
  }

  async start() {
    try {
      await this.program.parseAsync();
    } catch (err) {
      // Suppress Commander's error output
    }
  }
}

export function startCLI() {
  const cli = new AgentCLI();
  return cli.start();
}
