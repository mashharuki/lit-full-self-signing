# @lit-protocol/agent-contracts

Smart contracts for the Lit AI Agent system. These contracts manage agent policies, permissions, and tool registrations on-chain.

## Features

- On-chain policy management
- Tool registration and discovery
- PKP-specific action policies
- Permission management
- Upgradeable contract system

## Installation

```bash
pnpm add @lit-protocol/agent-contracts
```

## Smart Contracts

### LitAgentRegistry.sol

The main registry contract that manages:
- Tool registrations
- Policy storage and validation
- Permission management
- PKP associations

```solidity
interface ILitAgentRegistry {
    struct ActionPolicy {
        bool isPermitted;
        bytes description;
        bytes policy;
    }

    function registerAction(
        uint256 pkpId,
        string calldata ipfsCid,
        bytes calldata description,
        bytes calldata policy
    ) external;

    function updatePolicy(
        uint256 pkpId,
        string calldata ipfsCid,
        bytes calldata newPolicy
    ) external;

    function isActionPermitted(
        uint256 pkpId,
        string calldata ipfsCid
    ) external view returns (bool);

    function getActionPolicy(
        uint256 pkpId,
        string calldata ipfsCid
    ) external view returns (ActionPolicy memory);
}
```

## Development

### Prerequisites

- Node.js 16+
- Hardhat
- Foundry (optional, for additional testing)

### Setup

```bash
# Install dependencies
pnpm install

# Compile contracts
pnpm compile

# Run tests
pnpm test

# Deploy contracts
pnpm deploy
```

### Testing

The contracts include:
- Unit tests
- Integration tests
- Fuzz tests (via Foundry)
- Gas optimization tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm nx test agent-contracts -- test/LitAgentRegistry.test.ts

# Run gas reporter
REPORT_GAS=true pnpm test
```

### Deployment

1. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

2. Deploy contracts:
```bash
pnpm nx run agent-contracts:deploy -- --network <network>
```

3. Verify contracts:
```bash
pnpm nx run agent-contracts:verify -- --network <network> <contract-address>
```

## Security

These contracts have been:
- Audited by [Audit Firm]
- Tested extensively
- Designed with upgradability in mind
- Protected against common attack vectors

### Known Limitations

1. Policy size limitations
2. Gas costs for large policy updates
3. Upgrade timelock restrictions

## License

MIT
