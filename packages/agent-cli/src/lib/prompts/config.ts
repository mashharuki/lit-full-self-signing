import inquirer from 'inquirer';
import { logger } from '../utils/logger';
import { storage } from '../utils/storage';
import { ethers } from 'ethers';
import { LIT_RPC } from '@lit-protocol/constants';

async function checkAndPromptForBalance(wallet: ethers.Wallet): Promise<void> {
  const provider = new ethers.providers.JsonRpcProvider(
    LIT_RPC.CHRONICLE_YELLOWSTONE
  );
  let balance = await provider.getBalance(wallet.address);

  while (balance.lt(ethers.utils.parseEther('0.01'))) {
    logger.error(
      'Insufficient balance: Your wallet needs at least 0.01 Lit test tokens'
    );
    logger.warn(`Current balance: ${ethers.utils.formatEther(balance)} ETH`);
    logger.log(
      `Please fund your wallet (${wallet.address}) with Lit test tokens`
    );
    logger.log(
      'Get test tokens from: https://chronicle-yellowstone-faucet.getlit.dev/'
    );

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Have you funded your wallet with test tokens?',
        default: false,
      },
    ]);

    if (confirmed) {
      balance = await provider.getBalance(wallet.address);
    }
  }
}

export async function promptForOpenAIKey(): Promise<string> {
  const existingKey = storage.getOpenAIKey();
  if (existingKey) {
    return existingKey;
  }

  const { openAiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'openAiKey',
      message: 'Please enter your OpenAI API key:',
      validate: (input) => {
        if (!input) {
          return 'OpenAI API key is required';
        }
        return true;
      },
    },
  ]);

  storage.setOpenAIKey(openAiKey);
  return openAiKey;
}

export async function promptForAuthPrivateKey(): Promise<string> {
  const existingWallet = storage.getWallet();
  if (existingWallet) {
    const wallet = new ethers.Wallet(existingWallet.privateKey);
    await checkAndPromptForBalance(wallet);
    return existingWallet.privateKey;
  }

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message:
        'Would you like to generate a new auth key or provide an existing one?',
      choices: ['Generate New', 'Provide Existing'],
    },
  ]);

  if (choice === 'Generate New') {
    const wallet = ethers.Wallet.createRandom();
    logger.info(
      `Generated new Lit auth wallet with address: ${wallet.address}`
    );
    logger.log('Before continuing:');
    logger.log('1. Back up your private key in a secure location');
    logger.log(`2. Fund your wallet (${wallet.address}) with Lit test tokens`);
    logger.log(
      '   Get test tokens from: https://chronicle-yellowstone-faucet.getlit.dev/'
    );

    let confirmed = false;
    while (!confirmed) {
      const response = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message:
            'Have you backed up your private key and funded your wallet with test tokens?',
          default: false,
        },
      ]);

      if (!response.confirmed) {
        logger.warn(
          'Please back up your private key and fund your wallet before continuing'
        );
        logger.log(`Wallet Address: ${wallet.address}`);
        logger.log(
          'Faucet URL: https://chronicle-yellowstone-faucet.getlit.dev/'
        );
      } else {
        confirmed = true;
      }
    }

    const walletInfo = {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
    storage.setWallet(walletInfo);
    await checkAndPromptForBalance(wallet);
    return wallet.privateKey;
  } else {
    const { privateKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'privateKey',
        message: 'Please enter your auth private key:',
        validate: (input) => {
          if (!input) {
            return 'Private key is required';
          }
          try {
            // Try to create a wallet with the private key
            new ethers.Wallet(input);
            return true;
          } catch {
            return 'Invalid private key format';
          }
        },
      },
    ]);

    const wallet = new ethers.Wallet(privateKey);
    const walletInfo = {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
    storage.setWallet(walletInfo);
    logger.info(`Using wallet with address: ${wallet.address}`);
    await checkAndPromptForBalance(wallet);
    return wallet.privateKey;
  }
}

export async function promptForToolPolicyRegistryConfig(): Promise<
  | {
      rpcUrl: string;
      contractAddress: string;
    }
  | undefined
> {
  // Check if we have a stored preference
  const useDefault = storage.getUseDefaultRegistry();
  const customConfig = storage.getToolPolicyRegistryConfig();

  if (useDefault !== null) {
    // If we know they want default, return undefined to use AgentSigner defaults
    if (useDefault) {
      return undefined;
    }
    // If they want custom and we have it stored, return it
    if (customConfig) {
      return customConfig;
    }
  }

  // First time setup - ask user for preference
  const { useDefaultConfig } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useDefaultConfig',
      message:
        'Would you like to use the default Lit PKP Tool Policy Registry? (recommended)',
      default: true,
    },
  ]);

  if (useDefaultConfig) {
    // Store that they want to use default
    storage.setUseDefaultRegistry(true);
    return undefined;
  }

  // Get custom configuration
  const { rpcUrl, contractAddress } = await inquirer.prompt([
    {
      type: 'input',
      name: 'rpcUrl',
      message: 'Enter the RPC URL for the tool policy registry:',
      default: 'https://yellowstone-rpc.litprotocol.com/',
      validate: (input: string) => {
        if (!input) return 'RPC URL is required';
        if (!input.startsWith('http')) return 'Invalid RPC URL';
        return true;
      },
    },
    {
      type: 'input',
      name: 'contractAddress',
      message: 'Enter the contract address for the tool policy registry:',
      default: '0xD78e1C1183A29794A092dDA7dB526A91FdE36020',
      validate: (input: string) => {
        if (!input) return 'Contract address is required';
        if (!input.startsWith('0x')) return 'Invalid contract address';
        return true;
      },
    },
  ]);

  const config = { rpcUrl, contractAddress };
  // Store that they don't want default and their custom config
  storage.setUseDefaultRegistry(false);
  storage.setToolPolicyRegistryConfig(config);
  return config;
}
