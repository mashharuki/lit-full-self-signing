import {
  SendERC20LitActionParameters,
  SendERC20LitActionSchema,
  SendERC20LitActionMetadata,
  SendERC20LitActionParameterDescriptions,
  isValidSendERC20Parameters,
  sendERC20LitActionDescription,
  SendERC20Policy,
  SendERC20PolicySchema,
  encodeSendERC20Policy,
  decodeSendERC20Policy,
} from '@lit-protocol/agent-tool-erc20-send';

export const SendERC20 = {
  description: sendERC20LitActionDescription,
  Parameters: {
    type: {} as SendERC20LitActionParameters, // for type inference
    schema: SendERC20LitActionSchema,
    descriptions: SendERC20LitActionParameterDescriptions,
    validate: isValidSendERC20Parameters,
  },
  metadata: SendERC20LitActionMetadata,
  Policy: {
    type: {} as SendERC20Policy, // for type inference
    schema: SendERC20PolicySchema,
    encode: encodeSendERC20Policy,
    decode: decodeSendERC20Policy,
  },
} as const;

// Registry functionality
export const SUPPORTED_TOOLS = ['SendERC20'] as const;
export type SupportedToolTypes = (typeof SUPPORTED_TOOLS)[number];
