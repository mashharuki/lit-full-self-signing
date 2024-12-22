import inquirer from 'inquirer';
import { ethers } from 'ethers';
import { storage } from './utils/storage';
import { logger } from './utils/logger';

export interface StoredWallet {
  privateKey: string;
  address: string;
  timestamp: number;
}

export class WalletManager {
  async getStoredWallet(): Promise<StoredWallet | null> {
    return storage.getWallet();
  }

  private async promptForExistingWallet(): Promise<'use' | 'new'> {
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

  private async promptForWalletChoice(): Promise<'generate' | 'existing'> {
    const { choice } = await inquirer.prompt<{
      choice: 'generate' | 'existing';
    }>([
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
    return choice;
  }

  private async promptForPrivateKey(): Promise<string> {
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

  private generateNewWallet(): { privateKey: string; address: string } {
    const wallet = ethers.Wallet.createRandom();
    return {
      privateKey: wallet.privateKey,
      address: wallet.address,
    };
  }

  async getAuthPrivateKey(): Promise<string> {
    const existingWallet = await this.getStoredWallet();

    if (existingWallet) {
      const action = await this.promptForExistingWallet();
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

    const choice = await this.promptForWalletChoice();
    let privateKey: string;
    let address: string;

    if (choice === 'existing') {
      privateKey = await this.promptForPrivateKey();
      const wallet = new ethers.Wallet(privateKey);
      address = wallet.address;
    } else {
      const wallet = this.generateNewWallet();
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
}
