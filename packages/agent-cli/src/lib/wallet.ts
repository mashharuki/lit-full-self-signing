import inquirer from 'inquirer';
import { ethers } from 'ethers';
import { storage } from './utils/storage';
import { logger } from './utils/logger';

export interface StoredWallet {
  privateKey: string;
  address: string;
  timestamp: number;
}

async function promptForExistingWallet(): Promise<'use' | 'new'> {
  const { action } = await inquirer.prompt<{ action: 'use' | 'new' }>([
    {
      type: 'list',
      name: 'action',
      message: 'An auth wallet already exists. What would you like to do?',
      choices: [
        { name: 'Use existing wallet', value: 'use' },
        { name: 'Create new wallet (will overwrite existing)', value: 'new' },
      ],
    },
  ]);
  return action;
}

async function promptForWalletChoice(): Promise<'generate' | 'existing'> {
  const { choice } = await inquirer.prompt<{ choice: 'generate' | 'existing' }>(
    [
      {
        type: 'list',
        name: 'choice',
        message: 'How would you like to proceed?',
        choices: [
          { name: 'Generate new wallet', value: 'generate' },
          { name: 'Enter existing private key', value: 'existing' },
        ],
      },
    ]
  );
  return choice;
}

async function promptForPrivateKey(): Promise<string> {
  const { privateKey } = await inquirer.prompt<{ privateKey: string }>([
    {
      type: 'password',
      name: 'privateKey',
      message: 'Enter your private key (will be hidden):',
      validate: (input: string) => {
        try {
          if (!input.startsWith('0x')) {
            input = '0x' + input;
          }
          new ethers.Wallet(input);
          return true;
        } catch (e) {
          return 'Please enter a valid private key';
        }
      },
    },
  ]);
  return privateKey;
}

export async function getAuthPrivateKey(): Promise<string> {
  const existingWallet = storage.getWallet();

  if (existingWallet) {
    const action = await promptForExistingWallet();
    if (action === 'use') {
      logger.info(`Using existing wallet: ${existingWallet.address}`);
      return existingWallet.privateKey;
    }
  }

  logger.log('\nWallet Initialization');
  logger.log('--------------------');
  logger.info(
    'You need a private key with Lit test tokens to mint the agent wallet.'
  );
  logger.info(
    'You can either provide your own private key or have a new wallet generated for you.'
  );

  const choice = await promptForWalletChoice();
  let privateKey: string;
  let address: string;

  if (choice === 'existing') {
    privateKey = await promptForPrivateKey();
    const wallet = new ethers.Wallet(privateKey);
    address = wallet.address;
  } else {
    const wallet = ethers.Wallet.createRandom();
    privateKey = wallet.privateKey;
    address = wallet.address;

    logger.success('New wallet generated!');
    logger.info(`Address: ${address}`);
    logger.warn(
      'IMPORTANT: This private key will be stored in local storage, but make sure to back it up!'
    );
  }

  // Store the wallet information
  storage.storeWallet({
    privateKey,
    address,
    timestamp: Date.now(),
  });

  return privateKey;
}
