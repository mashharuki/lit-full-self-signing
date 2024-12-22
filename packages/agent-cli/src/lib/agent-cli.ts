import { Command } from 'commander';
import { AgentSigner } from '@lit-protocol/agent-signer';
import { logger } from './utils/logger';
import { showMainMenu } from './menu';
import { storage } from './utils/storage';
import { getAuthPrivateKey } from './wallet';

export class AgentCLI {
  private program: Command;
  public agentSigner: AgentSigner | null = null;

  constructor() {
    this.program = new Command();
    this.setupProgram();
  }

  private setupProgram() {
    // Disable Commander's default error handling
    this.program.exitOverride();

    this.program
      .name('agent-cli')
      .description('Interactive CLI for Lit Agent')
      .version('0.1.0')
      .action(async () => {
        logger.prompt('Welcome to Lit Agent CLI');
        await this.initialize();
        await showMainMenu(this);
      });
  }

  private async initialize() {
    // Check for existing PKP (agent wallet)
    const pkpInfo = AgentSigner.getPkpInfoFromStorage();
    if (!pkpInfo) {
      logger.info('No agent wallet found. Initializing a new one...');

      // Get auth wallet private key (either from storage or by creating new one)
      const privateKey = await getAuthPrivateKey();

      try {
        // Initialize AgentSigner with auth wallet
        this.agentSigner = await AgentSigner.create(privateKey);

        // Create PKP (agent wallet)
        await this.agentSigner.createWallet();
        logger.success('Agent wallet initialized successfully!');
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Insufficient balance')
        ) {
          logger.error(
            'Your Auth Wallet does not have enough Lit test tokens to mint the Agent Wallet.'
          );
          logger.info(
            'Please get Lit test tokens using the faucet before continuing: https://chronicle-yellowstone-faucet.getlit.dev/'
          );
          process.exit(1);
        }
        logger.error('Failed to initialize agent wallet: ' + error);
        process.exit(1);
      }
    } else {
      // PKP exists, initialize AgentSigner with existing auth wallet
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

  async start() {
    try {
      this.program.parse();
    } catch (err) {
      // Suppress Commander's error output
    }
  }
}

// Export a function to create and start the CLI
export function startCLI() {
  const cli = new AgentCLI();
  return cli.start();
}
