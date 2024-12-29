## 動かし方

- はじめ方

  ```bash
  lit-agent
  ```

  初回は鍵ペアを作成する。

  そして新たに作成されたウォレットアドレスに対して以下のサイトからfaucet用のトークンを送る。

  https://chronicle-yellowstone-faucet.getlit.dev/

  そしてOpen AIのAPI Keyを設定する。

  以下のように出力されればOK!

  ```bash
  ✅ Successfully initialized Lit Agent

  ℹ️  Lit Agent Wallet Address: 0x6A995f507e52018b4e84fAdB9Add494cFE22cE63
  ```

- ERC20 トークンの送金

  ```bash
  ✔ What would you like to do? ERC20 Send

  ℹ️  Executing tool...

  ⚠️  Tool Permission Required
  Name: SendERC20
  Description: A Lit Action that sends ERC-20 tokens.
  IPFS CID: QmNhHthBewPiwYxk9TDDfhKEnSftdkMNxkGiiTbUyB8Emd
  Parameters:
    - tokenIn: The Ethereum contract address of the ERC20 token you want to send. Must be a valid Ethereum address starting with 0x.
    - recipientAddress: The Ethereum wallet address of the recipient who will receive the tokens. Must be a valid Ethereum address starting with 0x.
    - amountIn: The amount of tokens to send, specified as a string. This should be a decimal number (e.g. "1.5" or "100"). The amount will be automatically adjusted based on the token's decimals.
    - chainId: The ID of the blockchain network to send the tokens on (e.g. 1 for Ethereum mainnet, 84532 for Base Sepolia).
    - rpcUrl: The RPC URL of the blockchain network to connect to (e.g. "https://base-sepolia-rpc.publicnode.com").
  ```

  色々設定すると送金できる。

  ```bash
  ✔ What would you like to do? send ERC20

  ℹ️  Executing tool...

  ⚠️  Some parameters are missing. Please provide them:
  ✔ Enter tokenIn (The Ethereum contract address of the ERC20 token you want to send. Must be a valid Ethereum address starting with 0x.):
  0x808456652fdb597867f38412077A9182bf77359F
  ✔ Enter recipientAddress (The Ethereum wallet address of the recipient who will receive the tokens. Must be a valid Ethereum address starting with 0x.):
  0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072
  ✔ Enter amountIn (The amount of tokens to send, specified as a string. This should be a decimal number (e.g. "1.5" or "100"). The amount will be automatically adjusted 
  based on the token's decimals.): 1
  ✔ Select the chain to use: Last Used (Base Sepolia)

  ℹ️  Parameters to be used:
    tokenIn: 0x808456652fdb597867f38412077A9182bf77359F
    recipientAddress: 0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072
    amountIn: 1
    rpcUrl: https://base-sepolia-rpc.publicnode.com
    chainId: 84532
  ✔ Would you like to proceed with these parameters? Yes

  ✅ Tool execution completed
  Result: {
    "success": true,
    "signedData": {},
    "decryptedData": {},
    "claimData": {},
    "response": "{\"status\":\"success\",\"transferHash\":\"0x59ab6da9768a8df76fd81a10c1b167f9e32aaf06fbe1f5c0b9bc11681027bd63\"}",
    "logs": "Getting token info for: 0x808456652fdb597867f38412077A9182bf77359F\nCreating token contract instance...\nFetching token decimals and balance...\nToken decimals: 6\nToken balance: 1000000\nAmount to send: 1000000\nEstimated gas limit: 45656\nSigning transfer...\nBroadcasting transfer...\nResult: 0x59ab6da9768a8df76fd81a10c1b167f9e32aaf06fbe1f5c0b9bc11681027bd63\n"
  }
  ```

  [AI Agentから送金した時の記録](https://sepolia.basescan.org/tx/0x59ab6da9768a8df76fd81a10c1b167f9e32aaf06fbe1f5c0b9bc11681027bd63)

- Flow テストネットで試してみる。

  [使ったERC20トークン](https://evm-testnet.flowscan.io/token/0x2B5914De5D5166eBaa423C92BAb8518c85EAA0cb)

  デフォルト以外のチェーンは、RPC IRLと名前とチェーンIDを指定する必要あり。

  ```bash
  ℹ️  Executing tool...

  ⚠️  Some parameters are missing. Please provide them:
  ✔ Enter tokenIn (The Ethereum contract address of the ERC20 token you want to send. Must be a valid Ethereum address starting with 0x.):
  0x2B5914De5D5166eBaa423C92BAb8518c85EAA0cb
  ✔ Enter recipientAddress (The Ethereum wallet address of the recipient who will receive the tokens. Must be a valid Ethereum address starting with 0x.):
  0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072
  ✔ Enter amountIn (The amount of tokens to send, specified as a string. This should be a decimal number (e.g. "1.5" or "100"). The amount will be automatically adjusted 
  based on the token's decimals.): 0.5
  ✔ Select the chain to use: flowTestnet

  ℹ️  Parameters to be used:
    tokenIn: 0x2B5914De5D5166eBaa423C92BAb8518c85EAA0cb
    recipientAddress: 0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072
    amountIn: 0.5
    rpcUrl: https://testnet.evm.nodes.onflow.org
    chainId: 545
  ```

  指定したけどなんかだめだった・・・。