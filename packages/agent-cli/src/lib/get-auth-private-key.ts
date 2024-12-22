import inquirer from 'inquirer';
import { ethers } from 'ethers';

import { storage } from './utils/storage';
import { logger } from './utils/logger';

export async function getAuthPrivateKey(): Promise<string> {
  // Check if wallet already exists
  const existingWallet = storage.getWallet();
  if (existingWallet) {
    const { action } = await inquirer.prompt([
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

    if (action === 'use') {
      logger.info(`Using existing wallet: ${existingWallet.address}`);
      return existingWallet.privateKey;
    }
  }

  logger.prompt('\nWallet Initialization');
  logger.prompt('--------------------');
  logger.info(
    'You need a private key with Lit test tokens to mint the agent wallet.'
  );
  logger.info(
    'You can either provide your own private key or have a new wallet generated.'
  );

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'How would you like to proceed?',
      choices: [
        { name: 'Generate new wallet', value: 'generate' },
        { name: 'Enter existing private key', value: 'existing' },
      ],
    },
  ]);

  let privateKey: string;
  let address: string;

  if (choice === 'existing') {
    const response = await inquirer.prompt([
      {
        type: 'password',
        name: 'privateKey',
        message: 'Enter your private key (will be hidden):',
        validate: (input: string) => {
          try {
            // Check if it's a valid private key
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

    privateKey = response.privateKey;
    const wallet = new ethers.Wallet(privateKey);
    address = wallet.address;
  } else {
    // Generate new wallet
    const wallet = ethers.Wallet.createRandom();
    privateKey = wallet.privateKey;
    address = wallet.address;

    logger.success('New wallet generated!');
    logger.info(`Address: ${address}`);
    logger.warn(
      'IMPORTANT: This private key will be stored in your local storage, but make sure to back it up!'
    );
    logger.info(`Private Key: ${privateKey}`);
  }

  // Store the wallet information
  storage.storeWallet({
    privateKey,
    address,
    timestamp: Date.now(),
  });

  return privateKey;
}
