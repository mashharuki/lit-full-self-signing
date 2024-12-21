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

// --- Policy Registry ---
export interface PolicyDefinition<T extends BaseAgentToolPolicy> {
  schema: z.ZodType<T>;
  encode: (policy: T) => string;
  decode: (encoded: string) => T;
}

const policyRegistry = new Map<string, PolicyDefinition<any>>();

export function registerPolicy<T extends BaseAgentToolPolicy>(
  type: string,
  definition: PolicyDefinition<T>
) {
  policyRegistry.set(type, definition);
}

// --- Utility Functions ---
export function validatePolicy<T extends BaseAgentToolPolicy>(
  type: string,
  policy: unknown
): T {
  const definition = policyRegistry.get(type);
  if (!definition) {
    throw new Error(`No policy definition found for type: ${type}`);
  }
  return definition.schema.parse(policy);
}

export function encodePolicy<T extends BaseAgentToolPolicy>(
  type: string,
  policy: T
): string {
  const definition = policyRegistry.get(type);
  if (!definition) {
    throw new Error(`No policy definition found for type: ${type}`);
  }
  return definition.encode(policy);
}

export function decodePolicy<T extends BaseAgentToolPolicy>(
  type: string,
  encoded: string
): T {
  const definition = policyRegistry.get(type);
  if (!definition) {
    throw new Error(`No policy definition found for type: ${type}`);
  }
  return definition.decode(encoded);
}
