# @lit-protocol/agent-signer

Secure transaction signing implementation for Lit AI Agents using Lit Protocol's Programmable Key Pairs (PKPs).

## Features

- Secure key management through Lit Protocol's PKP system
- Transaction signing for multiple chains
- Automatic capacity credit management
- Local storage for PKP and capacity credit persistence

## Installation

```bash
npm install @lit-protocol/agent-signer
```

## Usage

```typescript
import { AgentSigner } from '@lit-protocol/agent-signer';

// Create a new signer instance
const signer = await AgentSigner.create(
  'your-auth-private-key',
  {
    litNetwork: 'datilTest',
    debug: false
  }
);

// Sign a transaction
const signedTx = await signer.signTransaction({
  to: '0x...',
  value: '1000000000000000000',
  data: '0x...'
});
```

## Architecture

The signer works by:
1. Connecting to Lit Protocol network
2. Managing PKP minting and storage
3. Handling capacity credits for rate limiting
4. Providing secure transaction signing

## Security Features

- Secure key storage through Lit Protocol's PKP system
- Automatic balance checks for auth wallet
- Persistent storage of PKP and capacity credits
- Network-specific configurations

## API Reference

### `AgentSigner`

Main class for handling secure transaction signing.

#### Static Methods

##### `create()`
```typescript
static async create(
  authPrivateKey: string,
  options?: {
    litNetwork?: LIT_NETWORKS_KEYS;
    debug?: boolean;
  }
): Promise<AgentSigner>
```

Creates a new AgentSigner instance with the specified configuration.

#### Instance Methods

##### `signTransaction()`
```typescript
async signTransaction(
  transaction: ethers.providers.TransactionRequest
): Promise<string>
```

Signs an Ethereum transaction using the agent's PKP.

##### `signMessage()`
```typescript
async signMessage(message: string): Promise<string>
```

Signs a message using the agent's PKP.

## License

MIT
