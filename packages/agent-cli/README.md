# @lit-protocol/agent-cli

A command-line interface for interacting with Lit Protocol agents.

## Installation

```bash
npm install -g @lit-protocol/agent-cli
```

## Usage

Once installed, you can start the CLI by running:

```bash
lit-agent
```

The CLI will guide you through:
1. Setting up your agent wallet
2. Configuring your OpenAI API key
3. Interacting with your agent using natural language

### First Time Setup

On first run, you'll need to:
1. Either generate a new wallet or provide an existing private key
2. Fund your wallet with Lit test tokens from the faucet
3. Provide your OpenAI API key

### Example Commands

You can interact with your agent using natural language. For example:

```bash
> What would you like to do?
send 10 USDC to 0x1234...

> What would you like to do?
transfer 5 ETH from my wallet to 0x5678...
```

### Policy Configuration

When executing sensitive operations, you can configure policies to restrict:
- Maximum transaction amounts
- Allowed tokens
- Allowed recipients

## License

MIT
