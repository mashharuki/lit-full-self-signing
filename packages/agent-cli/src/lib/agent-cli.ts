import { Command } from 'commander';
import { logger } from './utils/logger';
import { MenuManager } from './menu-manager';

export function agentCli() {
  const program = new Command();

  // Disable Commander's default error handling
  program.exitOverride();

  program
    .name('agent-cli')
    .description('Interactive CLI for Lit Agent')
    .version('0.0.1')
    .action(async () => {
      logger.prompt('Welcome to Lit Agent CLI');
      const menuManager = new MenuManager();
      await menuManager.showMainMenu();
    });

  try {
    program.parse();
  } catch (err) {
    // Suppress Commander's error output
  }
}
