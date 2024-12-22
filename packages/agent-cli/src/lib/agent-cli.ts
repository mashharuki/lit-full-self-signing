import { Command } from 'commander';
import { AgentSigner } from '@lit-protocol/agent-signer';
import { logger } from './utils/logger';
import { showMainMenu } from './menu';

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
      .version('0.0.1')
      .action(async () => {
        logger.prompt('Welcome to Lit Agent CLI');
        await showMainMenu(this);
      });
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
