# @lit-protocol/agent-tool-erc20-send

A Lit AI Agent tool for sending ERC20 tokens. This package serves as both an example implementation and a production-ready tool for token transfers.

## Features

- ERC20 token transfers across multiple networks
- Configurable policy-based transfer limits
- Token and recipient allowlist support
- Automatic gas estimation and optimization
- Multi-chain support with network presets
- Detailed transaction logging
- Error handling with descriptive messages

## Installation

```bash
pnpm add @lit-protocol/agent-tool-erc20-send
```

## Supported Networks

Out of the box, the tool supports:
- Base Sepolia (testnet)
- Base Mainnet
- Ethereum Mainnet
- Ethereum Goerli (testnet)
- Polygon
- Optimism

Custom networks can be added through configuration.

## Usage

### Basic Token Transfer

```typescript
import { LitAgent } from '@lit-protocol/agent';

const agent = new LitAgent(authKey, openAiKey);
await agent.init();

// Execute token transfer
const result = await agent.executeTool(
  'ipfs://Qm...', // ERC20 Send tool CID
  {
    tokenIn: '0x...', // Token contract address
    recipientAddress: '0x...', // Recipient wallet address
    amountIn: '1.0', // Amount in token decimals
    rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
    chainId: 84532 // Base Sepolia
  }
);

console.log('Transfer hash:', result.response.transferHash);
```

### Advanced Usage

#### With Gas Price Configuration

```typescript
const result = await agent.executeTool(
  'ipfs://Qm...',
  {
    ...params,
    gasConfig: {
      maxFeePerGas: '50000000000', // 50 gwei
      maxPriorityFeePerGas: '1500000000' // 1.5 gwei
    }
  }
);
```

#### With Custom RPC Configuration

```typescript
const result = await agent.executeTool(
  'ipfs://Qm...',
  {
    ...params,
    rpcConfig: {
      timeout: 30000, // 30 seconds
      retries: 3
    }
  }
);
```

### Policy Configuration

The tool supports flexible policy configuration to ensure secure token transfers:

```typescript
const policy = {
  type: 'SendERC20',
  version: '1.0.0',
  // Maximum amount per transfer in token base units (e.g., wei)
  maxAmount: '1000000000000000000', // 1 token
  // List of allowed token contract addresses
  allowedTokens: [
    '0x4070c8325e278ca1056e602e08d16d2D5cd79b27', // DevERC20
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'  // USDC
  ],
  // List of allowed recipient addresses
  allowedRecipients: [
    '0x600DC16993EA1AbdA674A20d432F93041cDa2ef4',
    '0x...'
  ],
  // Optional network restrictions
  allowedNetworks: [
    84532, // Base Sepolia
    8453   // Base Mainnet
  ]
};

// Apply policy through agent
const result = await agent.executeTool(
  'ipfs://Qm...',
  params,
  {
    policyCallback: async () => ({
      usePolicy: true,
      policyValues: policy
    })
  }
);
```

## Error Handling

The tool provides detailed error messages for common scenarios:

```typescript
try {
  const result = await agent.executeTool('ipfs://Qm...', params);
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    console.error('Token balance too low:', error.message);
  } else if (error.code === 'POLICY_VIOLATION') {
    console.error('Transfer violates policy:', error.message);
  } else if (error.code === 'GAS_ESTIMATION_FAILED') {
    console.error('Gas estimation failed:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Tool Implementation Details

The tool is implemented as a Lit Action that follows this execution flow:

1. Parameter validation and normalization
2. Policy constraint verification
3. Token contract interaction setup
4. Balance and allowance checks
5. Gas estimation and optimization
6. Transaction construction and signing
7. Broadcasting and confirmation

### Required Parameters

| Parameter          | Type     | Description                          |
| ------------------ | -------- | ------------------------------------ |
| `tokenIn`          | `string` | ERC20 token contract address         |
| `recipientAddress` | `string` | Recipient wallet address             |
| `amountIn`         | `string` | Amount to transfer in token decimals |
| `rpcUrl`           | `string` | RPC endpoint for the target chain    |
| `chainId`          | `number` | Target chain ID                      |

### Optional Parameters

| Parameter             | Type      | Description                                  |
| --------------------- | --------- | -------------------------------------------- |
| `gasConfig`           | `object`  | Custom gas price settings                    |
| `rpcConfig`           | `object`  | RPC client configuration                     |
| `waitForConfirmation` | `boolean` | Whether to wait for transaction confirmation |

## Development

### Building

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Generate documentation
pnpm docs
```

### Testing

The package includes comprehensive tests:

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test:unit
pnpm test:integration

# Run with coverage
pnpm test:coverage
```

## Contributing

Please see our [Contributing Guide](../../CONTRIBUTING.md) for details on how to contribute to this package.

## License

MIT
