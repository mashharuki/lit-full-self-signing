# @lit-protocol/agent

The core agent implementation for the Lit AI Agent framework. This package provides the main functionality for processing natural language instructions and executing blockchain operations through registered tools.

## Features

- Natural language processing using OpenAI's GPT models
- Intent matching with available tools
- Secure transaction execution through Lit Protocol
- Policy enforcement and permission management
- Extensible tool system

## Installation

```bash
pnpm add @lit-protocol/agent
```

## Usage

```typescript
import { LitAgent } from '@lit-protocol/agent';

// Initialize the agent
const agent = new LitAgent(
  'your-lit-auth-private-key',
  'your-openai-api-key'
);
await agent.init();

// Process user intent and execute matching tool
const result = await agent.executeTool(
  'ipfs://tool-cid',
  {
    // Initial parameters
  },
  {
    // Optional callbacks for permissions and parameters
    permissionCallback: async (tool) => true,
    parameterCallback: async (tool, missingParams) => ({}),
    policyCallback: async (tool, currentPolicy) => ({ usePolicy: false })
  }
);
```

## Architecture

The agent works by:
1. Analyzing user intent through OpenAI
2. Matching intent to available tools
3. Collecting necessary parameters
4. Validating against policies
5. Executing the tool through Lit Protocol

## Security

The agent includes several security features:
- Tool-specific policy enforcement
- Permission callbacks for user approval
- Secure key management through Lit Protocol
- Parameter validation and sanitization

## API Reference

### `LitAgent`

Main class for interacting with the agent system.

#### Constructor
```typescript
constructor(
  litAuthPrivateKey: string,
  openAiApiKey: string,
  openAiModel?: string
)
```

#### Methods

##### `init()`
Initialize the agent and set up the signer.

##### `executeTool()`
Execute a specific tool with parameters and callbacks.

##### `analyzeUserIntentAndMatchAction()`
Process natural language input and find matching tool.

## License

MIT
