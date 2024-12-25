import inquirer from 'inquirer';
import { storage, type ChainConfig } from '../utils/storage';

export async function promptForChainConfig(): Promise<ChainConfig> {
  // Get stored chains
  const chains = storage.getStoredChains();
  const lastUsedChain = storage.getLastUsedChain();

  // Prompt for chain selection
  const { chainChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'chainChoice',
      message: 'Select the chain to use:',
      choices: [
        ...(lastUsedChain ? [`Last Used (${lastUsedChain})`] : []),
        ...Object.keys(chains),
        new inquirer.Separator(),
        'Add New Chain',
      ],
      default: lastUsedChain ? `Last Used (${lastUsedChain})` : undefined,
    },
  ]);

  if (chainChoice === 'Add New Chain') {
    const nameResponse = await inquirer.prompt<{ name: string }>([
      {
        type: 'input',
        name: 'name',
        message: 'Enter a name for this chain:',
        validate: (input: string) =>
          input.length > 0 || 'Chain name is required',
      },
    ]);

    const rpcResponse = await inquirer.prompt<{ rpcUrl: string }>([
      {
        type: 'input',
        name: 'rpcUrl',
        message: 'Enter the RPC URL:',
        validate: (input: string) => input.length > 0 || 'RPC URL is required',
      },
    ]);

    const chainIdResponse = await inquirer.prompt<{ chainId: string }>([
      {
        type: 'input',
        name: 'chainId',
        message: 'Enter the chain ID:',
        validate: (input: string) => {
          const num = Number(input);
          return !isNaN(num) || 'Chain ID must be a number';
        },
      },
    ]);

    const chainConfig: ChainConfig = {
      rpcUrl: rpcResponse.rpcUrl,
      chainId: Number(chainIdResponse.chainId),
    };

    // Save the new chain config
    storage.saveChainConfig(nameResponse.name, chainConfig);
    storage.saveLastUsedChain(nameResponse.name);

    return chainConfig;
  } else {
    const chainName = chainChoice.startsWith('Last Used (')
      ? chainChoice.slice(11, -1)
      : chainChoice;

    const chainConfig = chains[chainName];
    storage.saveLastUsedChain(chainName);

    return chainConfig;
  }
}
