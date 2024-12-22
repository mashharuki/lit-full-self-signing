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
} as const;

/**
 * Parameters required for the ERC20 Send Lit Action
 * @property tokenIn - The ERC20 token contract address to send
 * @property recipientAddress - The Ethereum address to receive the tokens
 * @property amountIn - The amount of tokens to send as a string (will be parsed based on token decimals)
 */
export interface SendERC20LitActionParameters {
  tokenIn: string;
  recipientAddress: string;
  amountIn: string;
}

/**
 * Metadata about the ERC20 Send Lit Action parameters including their descriptions and validation rules
 */
export const SendERC20LitActionMetadata = {
  name: 'SendERC20LitAction',
  description: sendERC20LitActionDescription,
  parameters: SendERC20LitActionParameterDescriptions,
  required: ['tokenIn', 'recipientAddress', 'amountIn'] as const,
  validation: {
    tokenIn:
      'Must be a valid Ethereum contract address (0x followed by 40 hexadecimal characters)',
    recipientAddress:
      'Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)',
    amountIn:
      'Must be a valid decimal number as a string (e.g. "1.5" or "100")',
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
});

/**
 * Type guard to check if parameters match the required schema
 */
export const isValidSendERC20Parameters = (
  params: unknown
): params is SendERC20LitActionParameters => {
  return SendERC20LitActionSchema.safeParse(params).success;
};
