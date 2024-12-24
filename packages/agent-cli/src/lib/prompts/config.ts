import inquirer from 'inquirer';
import { logger } from '../utils/logger';

export async function promptForConfig(): Promise<{
  litAuthPrivateKey: string;
  openAiApiKey: string;
  toolPolicyRegistryConfig?: {
    rpcUrl: string;
    contractAddress: string;
  };
}> {
  logger.warn('Configuration');

  const { litAuthPrivateKey, openAiApiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'litAuthPrivateKey',
      message: 'Enter your Lit Auth private key:',
      validate: (input: string) => {
        if (!input) return 'Private key is required';
        return true;
      },
    },
    {
      type: 'password',
      name: 'openAiApiKey',
      message: 'Enter your OpenAI API key:',
      validate: (input: string) => {
        if (!input) return 'API key is required';
        return true;
      },
    },
  ]);

  // Ask if user wants to use custom tool policy registry config
  const { useCustomConfig } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useCustomConfig',
      message:
        'Would you like to use a custom PKP Tool Policy Registry configuration?',
      default: false,
    },
  ]);

  if (useCustomConfig) {
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

    return {
      litAuthPrivateKey,
      openAiApiKey,
      toolPolicyRegistryConfig: {
        rpcUrl,
        contractAddress,
      },
    };
  }

  return {
    litAuthPrivateKey,
    openAiApiKey,
  };
}
