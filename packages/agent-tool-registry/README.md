# @lit-protocol/agent-tool-registry

Central registry for Lit AI Agent tools. This package manages the registration, discovery, and validation of tools that can be executed by Lit agents.

## Features

- Tool registration and management
- Policy validation
- Tool discovery and metadata
- Parameter validation
- IPFS integration for tool distribution

## Installation

```bash
npm install @lit-protocol/agent-tool-registry
```

## Usage

### Registering a Tool

```typescript
import { 
  registerTool,
  ToolInfo,
  validateParamsAgainstPolicy 
} from '@lit-protocol/agent-tool-registry';

// Define your tool
const myTool: ToolInfo = {
  name: 'MyTool',
  description: 'Performs a specific action',
  ipfsCid: 'Qm...',
  parameters: {
    param1: {
      type: 'string',
      description: 'First parameter',
      required: true
    },
    param2: {
      type: 'number',
      description: 'Second parameter',
      required: false
    }
  }
};

// Register the tool
registerTool(myTool);
```

### Using the Registry

```typescript
// List available tools
const tools = listAvailableTools();

// Get a specific tool
const tool = getToolFromRegistry('MyTool');

// Validate parameters against policy
validateParamsAgainstPolicy(
  tool,
  { param1: 'value1', param2: 42 },
  policyValues
);
```

## Tool Structure

Each tool in the registry must define:

1. Basic Information
   - Name
   - Description
   - IPFS CID of the implementation

2. Parameters
   - Name and type
   - Description
   - Required/optional status
   - Validation rules

3. Policy Requirements (optional)
   - Security constraints
   - Parameter restrictions
   - Network limitations

## API Reference

### Tool Management

#### `registerTool()`
```typescript
function registerTool(tool: ToolInfo): void
```
Register a new tool in the registry.

#### `listAvailableTools()`
```typescript
function listAvailableTools(): ToolInfo[]
```
Get a list of all registered tools.

#### `getToolFromRegistry()`
```typescript
function getToolFromRegistry(name: string): ToolInfo
```
Get a specific tool by name.

### Validation

#### `validateParamsAgainstPolicy()`
```typescript
function validateParamsAgainstPolicy(
  tool: ToolInfo,
  params: Record<string, any>,
  policy: any
): void
```
Validate tool parameters against its policy.

## License

MIT
