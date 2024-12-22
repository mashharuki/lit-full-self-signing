# agent-tool-registry

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build agent-tool-registry` to build the library.

## Running unit tests

Run `nx test agent-tool-registry` to execute the unit tests via [Jest](https://jestjs.io).

## Usage

```ts
import { SendERC20 } from "@lit-protocol/agent-tool-registry";

// Access parameters type
type Params = typeof SendERC20.Parameters.type;

// Validate parameters
const params = {
  tokenIn: "0x...",
  recipientAddress: "0x...",
  amountIn: "1.0"
};
if (SendERC20.Parameters.validate(params)) {
  // ...
}

// Access policy functionality
const policy: typeof SendERC20.Policy.type = {
  // ...
};
const encoded = SendERC20.Policy.encode(policy);

// Access metadata
console.log(SendERC20.metadata.description);
console.log(SendERC20.Parameters.descriptions.tokenIn);
```
