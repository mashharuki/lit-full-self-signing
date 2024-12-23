# @lit-protocol/agent-tool-erc20-send

A Lit AI Agent tool for sending ERC20 tokens. This package serves as both an example implementation and a production-ready tool for token transfers.

## Features

- ERC20 token transfers
- Policy-based transfer limits
- Token allowlist support
- Gas estimation
- Multi-chain support

## Installation

```bash
pnpm add @lit-protocol/agent-tool-erc20-send
```

## Usage

### As a Tool Consumer

The tool is automatically registered when installed and can be used through the Lit Agent:

```typescript
import { LitAgent } from '@lit-protocol/agent';

const agent = new LitAgent(authKey, openAiKey);
await agent.init();

// Execute token transfer
const result = await agent.executeTool(
  'ipfs://Qm...', // ERC20 Send tool CID
  {
    tokenIn: '0x...', // Token address
    recipientAddress: '0x...', // Recipient
    amountIn: '1.0' // Amount in token decimals
  }
);
```

### Policy Configuration

You can configure transfer policies:

```typescript
const policy = {
  type: 'SendERC20',
  maxAmount: '1000000000000000000', // 1 token in wei
  allowedTokens: [
    '0x...', // USDC
    '0x...'  // DAI
  ],
  allowedRecipients: [
    '0x...',
    '0x...'
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

## Tool Implementation

The tool is implemented as a Lit Action that:

1. Validates input parameters
2. Checks policy constraints
3. Estimates gas
4. Constructs and signs the transaction
5. Returns the signed transaction data

### Parameters

- `tokenIn`: Address of the ERC20 token
- `recipientAddress`: Recipient's wallet address
- `amountIn`: Amount to transfer (in token decimals)
- `rpcUrl`: RPC endpoint for the target chain
- `chainId`: Target chain ID

### Policy Options

- `maxAmount`: Maximum transfer amount
- `allowedTokens`: List of allowed token addresses
- `allowedRecipients`: List of allowed recipient addresses

## Development

### Building

```bash
pnpm build
```

This will:
1. Compile the TypeScript code
2. Bundle the Lit Action
3. Deploy to IPFS (if configured)

### Testing

```bash
pnpm test
```

## License

MIT
