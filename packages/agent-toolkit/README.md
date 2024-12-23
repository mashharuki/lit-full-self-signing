# @lit-protocol/agent-toolkit

A collection of shared utilities and interfaces for building Lit AI Agent tools. This toolkit provides the foundation for creating secure and policy-controlled agent tools.

## Features

- Base interfaces for tool development
- Policy management system
- Common utilities for blockchain interactions
- Type definitions for the Lit Protocol ecosystem

## Installation

```bash
npm install @lit-protocol/agent-toolkit
```

## Usage

### Creating a New Tool

```typescript
import { 
  BaseLitActionPolicy,
  BaseLitActionPolicySchema,
  registerPolicy
} from '@lit-protocol/agent-toolkit';

// 1. Define your policy interface
interface MyToolPolicy extends BaseLitActionPolicy {
  type: 'MyTool';
  maxAmount: string;
  allowedTokens: string[];
}

// 2. Create the policy schema
const MyToolPolicySchema = BaseLitActionPolicySchema.extend({
  type: z.literal('MyTool'),
  maxAmount: z.string(),
  allowedTokens: z.array(z.string())
});

// 3. Register your policy
registerPolicy<MyToolPolicy>('MyTool', {
  schema: MyToolPolicySchema,
  encode: (policy) => encodeMyToolPolicy(policy),
  decode: (bytes) => decodeMyToolPolicy(bytes)
});

// 4. Use the policy in your tool
const policy = validatePolicy<MyToolPolicy>('MyTool', userInput);
const encoded = encodePolicy('MyTool', policy);
```

### Working with Policies

```typescript
// Validate a policy against its schema
const policy = validatePolicy<SendERC20Policy>('SendERC20', {
  type: 'SendERC20',
  maxAmount: '1000000000000000000',
  allowedTokens: ['0x...', '0x...']
});

// Encode a policy for on-chain storage
const encoded = encodePolicy('SendERC20', policy);

// Decode a policy from on-chain data
const decoded = decodePolicy<SendERC20Policy>('SendERC20', encoded);
```

## Policy System

The toolkit provides a flexible policy system that allows tools to:
1. Define their security requirements
2. Validate user inputs against policies
3. Encode/decode policies for on-chain storage
4. Share common policy types across tools

### Built-in Policy Types

- `BaseLitActionPolicy`: The foundation for all policies
- `SendERC20Policy`: For ERC20 token transfers
- `SwapPolicy`: For token swap operations
- `NFTPolicy`: For NFT operations

## API Reference

### Policy Management

#### `registerPolicy<T>()`
Register a new policy type with its schema and encoding functions.

#### `validatePolicy<T>()`
Validate policy data against its registered schema.

#### `encodePolicy()`
Encode a policy for on-chain storage.

#### `decodePolicy<T>()`
Decode a policy from on-chain data.

### Utilities

#### `formatUnits()`
Format token amounts with proper decimals.

#### `parseUnits()`
Parse token amounts into on-chain format.

#### `validateAddress()`
Validate Ethereum addresses.

## License

MIT
