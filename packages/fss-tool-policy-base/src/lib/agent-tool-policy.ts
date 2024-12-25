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

// Interface for policy definition
export interface PolicyDefinition<T extends BaseAgentToolPolicy> {
  schema: z.ZodSchema<T>;
  encode: (policy: T) => string;
  decode: (encodedPolicy: string, version: string) => T;
}

// Map to store registered policies
const policyRegistry = new Map<string, PolicyDefinition<any>>();

// Register a new policy type with its schema and encoding functions
export function registerPolicy<T extends BaseAgentToolPolicy>(
  type: string,
  definition: PolicyDefinition<T>
) {
  policyRegistry.set(type, definition);
}

// Get a registered policy definition
export function getPolicyDefinition<T extends BaseAgentToolPolicy>(
  type: string
): PolicyDefinition<T> {
  const definition = policyRegistry.get(type);
  if (!definition) {
    throw new Error(`No policy definition found for type: ${type}`);
  }
  return definition;
}

// Validate policy data against its registered schema
export function validatePolicy<T extends BaseAgentToolPolicy>(
  type: string,
  policy: unknown
): T {
  const definition = getPolicyDefinition<T>(type);
  return definition.schema.parse(policy);
}

// Encode a policy for on-chain storage
export function encodePolicy<T extends BaseAgentToolPolicy>(
  type: string,
  policy: T
): string {
  const definition = getPolicyDefinition<T>(type);
  return definition.encode(validatePolicy<T>(type, policy));
}

// Decode a policy from on-chain data
export function decodePolicy<T extends BaseAgentToolPolicy>(
  type: string,
  encodedPolicy: string,
  version: string
): T {
  const definition = getPolicyDefinition<T>(type);
  return definition.decode(encodedPolicy, version);
}
