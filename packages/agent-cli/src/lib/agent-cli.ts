import { Command } from 'commander';
import inquirer from 'inquirer';
import { AgentSigner } from '@lit-protocol/agent-signer';

import { getAuthPrivateKey } from './get-auth-private-key';
import { logger } from './utils/logger';
import { storage } from './utils/storage';

const program = new Command();

interface MenuChoice {
  name: string;
  value: string;
  handler: () => Promise<void>;
}

let agentSigner: AgentSigner | null = null;

const menuChoices: MenuChoice[] = [
  {
    name: 'Initialize Agent Auth Wallet',
    value: 'init-auth-wallet',
    handler: async () => {
      try {
        const privateKey = await getAuthPrivateKey();

        try {
          agentSigner = await AgentSigner.create(privateKey);
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

        logger.success(
          'Agent Auth Wallet initialization completed successfully!'
        );
      } catch (error) {
        logger.error('Error initializing wallet: ' + error);
      }
    },
  },
  {
    name: 'Initialize Agent Wallet',
    value: 'init-agent-wallet',
    handler: async () => {
      if (agentSigner === null) {
        const existingWallet = storage.getWallet();
        if (existingWallet === null) {
          logger.error(
            'No Agent Auth Wallet found. Please initialize an Agent Auth Wallet first.'
          );
          return;
        }
        agentSigner = await AgentSigner.create(existingWallet.privateKey);
        const pkpInfo = await agentSigner.createWallet();
        storage.storePkpInfo(pkpInfo.pkpInfo);
        logger.success('Agent Wallet initialization completed successfully!');
      }
    },
  },
  {
    name: 'Add Tools to Agent Wallet',
    value: 'add-tools',
    handler: async () => {
      process.exit(0);
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
