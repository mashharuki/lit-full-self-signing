# Lit AI Agent

A modular framework for building AI agents that can interact with blockchain and web3 infrastructure through the Lit Protocol ecosystem. This project enables the creation of autonomous agents that can execute blockchain transactions and interact with smart contracts based on natural language instructions, while maintaining security through configurable policies.

## Project Overview

The Lit AI Agent project consists of several packages that work together to provide a complete framework for building and deploying AI agents:

- `agent`: Core agent implementation that handles natural language processing and tool execution
- `agent-cli`: Command-line interface for interacting with Lit agents
- `agent-contracts`: Smart contracts for agent registry and policy management
- `agent-signer`: Handles authentication and signing of transactions
- `agent-tool-registry`: Registry for available agent tools and capabilities
- `agent-tool-erc20-send`: Example tool implementation for sending ERC20 tokens
- `agent-tool-policy-base`: Shared utilities and interfaces for building agent tools

## Development

This is an Nx monorepo using pnpm workspaces. Here's how to work with it:

```bash
# Build a specific package
pnpm nx build <package-name>

# Test a specific package
pnpm nx test <package-name>

# Run a command across all packages
pnpm nx run-many -t <command>

# Generate a new package
pnpm nx g @nx/js:lib packages/new-package --publishable --importPath=@lit-protocol/new-package

# Visualize project dependencies
pnpm nx graph
```

## Architecture

The project follows a modular architecture where:

1. The core agent (`agent`) processes natural language through OpenAI and matches intents to available tools
2. Tools are registered in the `agent-tool-registry` with their capabilities and policies
3. The `agent-signer` handles secure transaction signing using Lit Protocol's PKPs
4. Smart contracts in `agent-contracts` manage on-chain policies and permissions
5. The `agent-tool-policy-base` provides shared utilities for building new tools

## Security

The framework includes multiple security layers:

1. Tool-specific policies that can restrict operations (e.g., max transaction amounts)
2. On-chain policy management through smart contracts
3. Secure key management through Lit Protocol's PKP system
4. Permission callbacks for user approval of sensitive operations

## Contributing

Contributions are welcome! Please check out our [Contributing Guide](CONTRIBUTING.md) for guidelines.

## License

MIT
