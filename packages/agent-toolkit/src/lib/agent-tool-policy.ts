import { z } from 'zod';

// --- Base Policy Types ---
export const BaseEthereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/);
export type EthereumAddress = z.infer<typeof BaseEthereumAddressSchema>;

// Base interface that all policies must implement
export interface BaseAgentToolPolicy {
  type: string;
  version: string;
}

// Base Zod schema that all policy schemas must extend
export const BaseLitActionPolicySchema = z.object({
  type: z.string(),
  version: z.string(),
});
