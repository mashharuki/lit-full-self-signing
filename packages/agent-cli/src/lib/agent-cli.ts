import { Command } from 'commander';
import inquirer from 'inquirer';
import { AgentSigner } from '@lit-protocol/agent-signer';

import { getAuthPrivateKey } from './commands/get-auth-private-key';
import { logger } from './utils/logger';

const program = new Command();

interface MenuChoice {
  name: string;
  value: string;
  handler: () => Promise<void>;
}

const menuChoices: MenuChoice[] = [
  {
    name: 'Initialize Agent Wallet',
    value: 'init-wallet',
    handler: async () => {
      try {
        const privateKey = await getAuthPrivateKey();

        try {
          await AgentSigner.create(privateKey);
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes('Insufficient balance')
          ) {
            logger.warn('Your wallet does not have enough Lit test tokens.');
            logger.info(
              'Please get some using the faucet before continuing: https://chronicle-yellowstone-faucet.getlit.dev/'
            );
            return;
          }
          throw error;
        }

        logger.success('Wallet initialization completed successfully!');
      } catch (error) {
        logger.error('Error initializing wallet: ' + error);
      }
    },
  },
  {
    name: 'Exit',
    value: 'exit',
    handler: async () => {
      process.exit(0);
    },
  },
];

async function showMainMenu() {
  while (true) {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'What would you like to do?',
        choices: menuChoices.map(({ name, value }) => ({ name, value })),
      },
    ]);

    const selectedChoice = menuChoices.find((c) => c.value === choice);
    if (selectedChoice) {
      await selectedChoice.handler();
    }
  }
}

export function agentCli() {
  // Disable Commander's default error handling
  program.exitOverride();

  program
    .name('agent-cli')
    .description('Interactive CLI for Lit Protocol Agent')
    .version('0.0.1')
    .action(async () => {
      logger.prompt('Welcome to Lit Protocol Agent CLI');
      await showMainMenu();
    });

  try {
    program.parse();
  } catch (err) {
    // Suppress Commander's error output
  }
}
