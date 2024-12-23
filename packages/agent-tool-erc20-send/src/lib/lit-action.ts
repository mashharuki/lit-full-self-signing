declare global {
  // Injected By Lit
  const Lit: any;
  const LitAuth: any;
  const ethers: {
    providers: {
      JsonRpcProvider: any;
    };
    utils: {
      Interface: any;
      parseUnits: any;
      formatUnits: any;
      arrayify: any;
      keccak256: any;
      serializeTransaction: any;
      joinSignature: any;
      isHexString: any;
    };
    BigNumber: any;
    Contract: any;
  };

  // Required Inputs
  const chainInfo: {
    rpcUrl: string;
    chainId: number;
  };
  const pkp: {
    ethAddress: string;
    publicKey: string;
  };
  const params: {
    tokenIn: string;
    recipientAddress: string;
    amountIn: string;
  };
}

export default (async () => {
  try {
    // Helper Functions
    async function getTokenInfo(provider: any) {
      const tokenInterface = new ethers.utils.Interface([
        'function decimals() view returns (uint8)',
        'function balanceOf(address account) view returns (uint256)',
        'function transfer(address to, uint256 amount) external returns (bool)',
      ]);

      const tokenContract = new ethers.Contract(
        params.tokenIn,
        tokenInterface,
        provider
      );

      const [decimals, balance] = await Promise.all([
        tokenContract.decimals(),
        tokenContract.balanceOf(pkp.ethAddress),
      ]);

      const amount = ethers.utils.parseUnits(params.amountIn, decimals);

      if (amount.gt(balance)) {
        throw new Error(
          `Insufficient balance. PKP balance: ${ethers.utils.formatUnits(
            balance,
            decimals
          )}. Required: ${ethers.utils.formatUnits(amount, decimals)}`
        );
      }

      return { decimals, balance, amount };
    }

    async function getGasData() {
      const gasData = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'gasPriceGetter' },
        async () => {
          const provider = new ethers.providers.JsonRpcProvider(
            chainInfo.rpcUrl
          );
          const baseFeeHistory = await provider.send('eth_feeHistory', [
            '0x1',
            'latest',
            [],
          ]);
          const baseFee = ethers.BigNumber.from(
            baseFeeHistory.baseFeePerGas[0]
          );
          const nonce = await provider.getTransactionCount(pkp.ethAddress);

          const priorityFee = baseFee.div(4);
          const maxFee = baseFee.mul(2);

          return JSON.stringify({
            maxFeePerGas: maxFee.toHexString(),
            maxPriorityFeePerGas: priorityFee.toHexString(),
            nonce,
          });
        }
      );

      return JSON.parse(gasData);
    }

    async function estimateGasLimit(provider: any, amount: any) {
      const tokenInterface = new ethers.utils.Interface([
        'function transfer(address to, uint256 amount) external returns (bool)',
      ]);

      const tokenContract = new ethers.Contract(
        params.tokenIn,
        tokenInterface,
        provider
      );

      try {
        const estimatedGas = await tokenContract.estimateGas.transfer(
          params.recipientAddress,
          amount,
          { from: pkp.ethAddress }
        );
        console.log('Estimated gas limit:', estimatedGas.toString());
        return estimatedGas.mul(120).div(100);
      } catch (error) {
        console.error(
          'Could not estimate gas. Using fallback gas limit of 100000.',
          error
        );
        return ethers.BigNumber.from('100000');
      }
    }

    async function createAndSignTransaction(
      gasLimit: any,
      amount: any,
      gasData: any
    ) {
      const tokenInterface = new ethers.utils.Interface([
        'function transfer(address to, uint256 amount) external returns (bool)',
      ]);

      const transferTx = {
        to: params.tokenIn,
        data: tokenInterface.encodeFunctionData('transfer', [
          params.recipientAddress,
          amount,
        ]),
        value: '0x0',
        gasLimit: gasLimit.toHexString(),
        maxFeePerGas: gasData.maxFeePerGas,
        maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
        nonce: gasData.nonce,
        chainId: chainInfo.chainId,
        type: 2,
      };

      console.log('Signing transfer...');
      const transferSig = await Lit.Actions.signAndCombineEcdsa({
        toSign: ethers.utils.arrayify(
          ethers.utils.keccak256(ethers.utils.serializeTransaction(transferTx))
        ),
        publicKey: pkp.publicKey,
        sigName: 'erc20TransferSig',
      });

      return ethers.utils.serializeTransaction(
        transferTx,
        ethers.utils.joinSignature({
          r: '0x' + JSON.parse(transferSig).r.substring(2),
          s: '0x' + JSON.parse(transferSig).s,
          v: JSON.parse(transferSig).v,
        })
      );
    }

    async function broadcastTransaction(signedTx: string) {
      console.log('Broadcasting transfer...');
      return await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'txnSender' },
        async () => {
          try {
            const provider = new ethers.providers.JsonRpcProvider(
              chainInfo.rpcUrl
            );
            const tx = await provider.sendTransaction(signedTx);
            console.log('Transaction sent:', tx.hash);

            const receipt = await tx.wait(1);
            console.log('Transaction mined:', receipt.transactionHash);

            return receipt.transactionHash;
          } catch (err: any) {
            console.error('Error details:', {
              message: err.message,
              code: err.code,
              reason: err.reason,
              transaction: err.transaction,
              receipt: err.receipt,
            });
            throw new Error(`Transaction failed: ${err.message}`);
          }
        }
      );
    }

    // Main Execution
    const provider = new ethers.providers.JsonRpcProvider(chainInfo.rpcUrl);
    const tokenInfo = await getTokenInfo(provider);
    const gasData = await getGasData();
    const gasLimit = await estimateGasLimit(provider, tokenInfo.amount);
    const signedTx = await createAndSignTransaction(
      gasLimit,
      tokenInfo.amount,
      gasData
    );
    const transferHash = await broadcastTransaction(signedTx);

    if (!ethers.utils.isHexString(transferHash)) {
      throw new Error(`Invalid transaction hash: ${transferHash}`);
    }

    Lit.Actions.setResponse({
      response: JSON.stringify({
        status: 'success',
        transferHash,
      }),
    });
  } catch (err: any) {
    console.error('Error:', err);
    Lit.Actions.setResponse({
      response: JSON.stringify({
        status: 'error',
        error: err.message || String(err),
        details: err.cause ? String(err.cause) : undefined,
      }),
    });
  }
})();
