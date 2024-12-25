import { z } from 'zod';

export const sendERC20LitActionDescription =
  'A Lit Action that sends ERC-20 tokens.';

/**
 * Descriptions of each parameter for the ERC20 Send Lit Action
 * These descriptions are designed to be consumed by LLMs to understand the required parameters
 */
export const SendERC20LitActionParameterDescriptions = {
  tokenIn:
    'The Ethereum contract address of the ERC20 token you want to send. Must be a valid Ethereum address starting with 0x.',
  recipientAddress:
    'The Ethereum wallet address of the recipient who will receive the tokens. Must be a valid Ethereum address starting with 0x.',
  amountIn:
    'The amount of tokens to send, specified as a string. This should be a decimal number (e.g. "1.5" or "100"). The amount will be automatically adjusted based on the token\'s decimals.',
  chainId:
    'The ID of the blockchain network to send the tokens on (e.g. 1 for Ethereum mainnet, 84532 for Base Sepolia).',
  rpcUrl:
    'The RPC URL of the blockchain network to connect to (e.g. "https://base-sepolia-rpc.publicnode.com").',
} as const;

/**
 * Parameters required for the ERC20 Send Lit Action
 * @property tokenIn - The ERC20 token contract address to send
 * @property recipientAddress - The Ethereum address to receive the tokens
 * @property amountIn - The amount of tokens to send as a string (will be parsed based on token decimals)
 * @property chainId - The ID of the blockchain network
 * @property rpcUrl - The RPC URL of the blockchain network
 */
export interface SendERC20LitActionParameters {
  tokenIn: string;
  recipientAddress: string;
  amountIn: string;
  chainId: string;
  rpcUrl: string;
}

/**
 * Metadata about the ERC20 Send Lit Action parameters including their descriptions and validation rules
 */
export const SendERC20LitActionMetadata = {
  name: 'SendERC20LitAction',
  version: '1.0.0',
  description: sendERC20LitActionDescription,
  parameters: SendERC20LitActionParameterDescriptions,
  required: [
    'tokenIn',
    'recipientAddress',
    'amountIn',
    'chainId',
    'rpcUrl',
  ] as const,
  validation: {
    tokenIn:
      'Must be a valid Ethereum contract address (0x followed by 40 hexadecimal characters)',
    recipientAddress:
      'Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)',
    amountIn:
      'Must be a valid decimal number as a string (e.g. "1.5" or "100")',
    chainId: 'Must be a valid chain ID number as a string',
    rpcUrl: 'Must be a valid HTTPS URL for the blockchain RPC endpoint',
  },
} as const;

/**
 * Zod schema for validating SendERC20LitActionParameters
 */
export const SendERC20LitActionSchema = z.object({
  tokenIn: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      SendERC20LitActionMetadata.validation.tokenIn
    ),
  recipientAddress: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      SendERC20LitActionMetadata.validation.recipientAddress
    ),
  amountIn: z
    .string()
    .regex(/^\d*\.?\d+$/, SendERC20LitActionMetadata.validation.amountIn),
  chainId: z
    .string()
    .regex(/^\d+$/, SendERC20LitActionMetadata.validation.chainId),
  rpcUrl: z
    .string()
    .url()
    .startsWith('https://', SendERC20LitActionMetadata.validation.rpcUrl),
});

/**
 * Type guard to check if parameters match the required schema
 */
export const isValidSendERC20Parameters = (
  params: unknown
): params is SendERC20LitActionParameters => {
  return SendERC20LitActionSchema.safeParse(params).success;
};
