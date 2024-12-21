# agent-toolkit

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build agent-toolkit` to build the library.

## Running unit tests

Run `nx test agent-toolkit` to execute the unit tests via [Jest](https://jestjs.io).

# Lit Agent Tool Policies

## Create A New Policy

```ts
// Define interface extending BaseLitActionPolicy
interface MyNewPolicy extends BaseLitActionPolicy {
    type: 'MyNewPolicy';
    // ... your policy fields
}

// Create Zod schema
const MyNewPolicySchema = BaseLitActionPolicySchema.extend({
    type: z.literal('MyNewPolicy'),
    // ... your schema fields
});

// Register the policy
registerPolicy<MyNewPolicy>('MyNewPolicy', {
    schema: MyNewPolicySchema,
    encode: encodeMyNewPolicy,
    decode: decodeMyNewPolicy,
});
```

## Use A Policy

```ts
// Validate a policy
const policy = validatePolicy<SendERC20Policy>('SendERC20', userInput);

// Encode a policy
const encoded = encodePolicy('SendERC20', policy);

// Decode a policy
const decoded = decodePolicy<SendERC20Policy>('SendERC20', encoded);
```

## Example ERC20 Send Policy

```ts
// --- SendERC20 Policy Implementation ---
export interface SendERC20Policy extends BaseLitActionPolicy {
  type: 'SendERC20';
  maxAmount: string;
  allowedTokens: EthereumAddress[];
  allowedRecipients: EthereumAddress[];
}

export const SendERC20PolicySchema = BaseLitActionPolicySchema.extend({
  type: z.literal('SendERC20'),
  maxAmount: z.string().refine(
    (val) => {
      try {
        ethers.BigNumber.from(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid amount format' }
  ),
  allowedTokens: z.array(BaseEthereumAddressSchema),
  allowedRecipients: z.array(BaseEthereumAddressSchema),
});

export function encodeSendERC20Policy(policy: SendERC20Policy): string {
  // Validate the policy using Zod
  SendERC20PolicySchema.parse(policy);

  return ethers.utils.defaultAbiCoder.encode(
    [
      'tuple(uint256 maxAmount, address[] allowedTokens, address[] allowedRecipients)',
    ],
    [
      {
        maxAmount: policy.maxAmount,
        allowedTokens: policy.allowedTokens,
        allowedRecipients: policy.allowedRecipients,
      },
    ]
  );
}

export function decodeSendERC20Policy(encodedPolicy: string): SendERC20Policy {
  const decoded = ethers.utils.defaultAbiCoder.decode(
    [
      'tuple(uint256 maxAmount, address[] allowedTokens, address[] allowedRecipients)',
    ],
    encodedPolicy
  )[0];

  const policy: SendERC20Policy = {
    type: 'SendERC20',
    version: '1.0.0',
    maxAmount: decoded.maxAmount.toString(),
    allowedTokens: decoded.allowedTokens,
    allowedRecipients: decoded.allowedRecipients,
  };

  // Validate the decoded policy
  return SendERC20PolicySchema.parse(policy);
}

// Register the SendERC20 policy
registerPolicy<SendERC20Policy>('SendERC20', {
  schema: SendERC20PolicySchema,
  encode: encodeSendERC20Policy,
  decode: decodeSendERC20Policy,
});
```
