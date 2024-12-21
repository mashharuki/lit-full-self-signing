import { ethers } from 'ethers';
import {
  LIT_RPC,
  AUTH_METHOD_SCOPE,
  LIT_NETWORK,
} from '@lit-protocol/constants';
import { existsSync, mkdirSync, rmSync } from 'fs';

import type { MintWithAuthResponse } from '@lit-protocol/types';

import { localStorage } from './localstorage';
import { AgentSigner } from './agent-signer';

interface WalletInfo {
  pkpInfo: {
    tokenId: string;
    publicKey: string;
    ethAddress: string;
  };
  pkpMintTx: ethers.ContractTransaction;
  pkpMintReceipt: MintWithAuthResponse<ethers.ContractReceipt>;
}

describe('AgentSigner Integration Tests', () => {
  let LIT_AUTH_PRIVATE_KEY: string;

  beforeAll(() => {
    if (!process.env.LIT_AUTH_PRIVATE_KEY) {
      throw new Error('LIT_AUTH_PRIVATE_KEY environment variable is required');
    }

    LIT_AUTH_PRIVATE_KEY = process.env.LIT_AUTH_PRIVATE_KEY;

    // Clear all storage before any tests run
    if (existsSync('./agent-signer-storage')) {
      rmSync('./agent-signer-storage', { recursive: true, force: true });
    }
    mkdirSync('./agent-signer-storage');
  });

  afterAll(() => {
    // Clean up after all tests
    if (existsSync('./agent-signer-storage')) {
      rmSync('./agent-signer-storage', { recursive: true, force: true });
    }
  });

  describe('DatilDev Network', () => {
    let agentSigner: AgentSigner;

    beforeAll(async () => {
      agentSigner = await AgentSigner.create(LIT_AUTH_PRIVATE_KEY, {
        litNetwork: LIT_NETWORK.DatilDev,
      });
    }, 30000);

    afterAll(async () => {
      await agentSigner?.disconnectLitNodeClient();
    });

    describe('Basic Operations', () => {
      beforeEach(async () => {
        // Create a wallet before each test
        const walletInfo = await agentSigner.createWallet();
        expect(walletInfo.pkpInfo).toBeDefined();
      });

      it('should execute JavaScript code', async () => {
        const result = await agentSigner.executeJs({
          code: `(async () => { Lit.Actions.setResponse({"response": "Hello from Lit Protocol!" }); })()`,
          jsParams: {},
        });
        expect(result).toHaveProperty('response');
        expect(result.response).toBe('Hello from Lit Protocol!');
      }, 10000);

      it('should execute JavaScript code from IPFS', async () => {
        const result = await agentSigner.executeJs({
          ipfsId: 'QmQwNvbP9YAY4B4wYgFoD6cNnX3udNDBjWC7RqN48GdpmN',
          jsParams: {
            publicKey: AgentSigner.getPkpInfoFromStorage()?.publicKey,
          },
        });
        expect(result).toHaveProperty('response');
        expect(result.response).toBeDefined();
      }, 30000);
    });

    describe('Wallet Operations', () => {
      it('should create a wallet and sign a message', async () => {
        const walletInfo: WalletInfo = await agentSigner.createWallet();
        expect(walletInfo.pkpInfo).toBeDefined();

        const messageToSign =
          '0x8111e78458fec7fb123fdfe3c559a1f7ae33bf21bf81d1bad589e9422c648cbd';
        const signResult = await agentSigner.pkpSign({ toSign: messageToSign });
        expect(signResult.signature).toBeDefined();
      }, 30000);
    });

    describe('PKP Actions', () => {
      it('should add and verify a permitted action', async () => {
        const walletInfo: WalletInfo = await agentSigner.createWallet();
        const provider = new ethers.providers.JsonRpcProvider(
          LIT_RPC.CHRONICLE_YELLOWSTONE
        );
        await provider.waitForTransaction(walletInfo.pkpMintTx.hash, 2);

        const ipfsCid = 'QmTestHash123';
        const addResult = await agentSigner.pkpPermitLitAction({
          ipfsCid,
          signingScopes: [AUTH_METHOD_SCOPE.SignAnything],
        });
        await provider.waitForTransaction(addResult.transactionHash, 2);

        // Get PKP from storage to verify
        const pkp = AgentSigner.getPkpInfoFromStorage();
        expect(pkp).toBeDefined();
      }, 60000);
    });

    describe('Capacity Credits', () => {
      beforeEach(() => {
        // Create directory if it doesn't exist
        if (!existsSync('./agent-signer-storage')) {
          mkdirSync('./agent-signer-storage');
        }
        // Clear all storage
        localStorage.clear();
        rmSync('./agent-signer-storage', { recursive: true, force: true });
        mkdirSync('./agent-signer-storage');
      });

      it('should not have capacity credits on dev network', async () => {
        const walletInfo: WalletInfo = await agentSigner.createWallet();
        expect(walletInfo.pkpInfo).toBeDefined();

        const capacityCreditId = AgentSigner.getCapacityCreditIdFromStorage();
        expect(capacityCreditId).toBeNull();
      }, 30000);
    });
  });

  describe('DatilTest Network', () => {
    let agentSigner: AgentSigner;

    beforeAll(async () => {
      agentSigner = await AgentSigner.create(LIT_AUTH_PRIVATE_KEY, {
        litNetwork: LIT_NETWORK.DatilTest,
      });
    }, 30000);

    afterAll(async () => {
      await agentSigner?.disconnectLitNodeClient();
    });

    describe('Basic Operations', () => {
      beforeEach(async () => {
        // Create a wallet with capacity credits before each test
        const walletInfo = await agentSigner.createWallet({
          requestsPerKilosecond: 10,
          daysUntilUTCMidnightExpiration: 1,
        });
        expect(walletInfo.pkpInfo).toBeDefined();
      });

      it('should execute JavaScript code', async () => {
        const result = await agentSigner.executeJs({
          code: `(async () => { Lit.Actions.setResponse({"response": "Hello from Lit Protocol!" }); })()`,
          jsParams: {},
        });
        expect(result).toHaveProperty('response');
        expect(result.response).toBe('Hello from Lit Protocol!');
      }, 10000);

      it('should execute JavaScript code from IPFS', async () => {
        const result = await agentSigner.executeJs({
          ipfsId: 'QmQwNvbP9YAY4B4wYgFoD6cNnX3udNDBjWC7RqN48GdpmN',
          jsParams: {
            publicKey: AgentSigner.getPkpInfoFromStorage()?.publicKey,
          },
        });
        expect(result).toHaveProperty('response');
        expect(result.response).toBeDefined();
      }, 30000);
    });

    describe('Capacity Credits', () => {
      beforeEach(() => {
        // Create directory if it doesn't exist
        if (!existsSync('./agent-signer-storage')) {
          mkdirSync('./agent-signer-storage');
        }
        // Clear all storage
        localStorage.clear();
        rmSync('./agent-signer-storage', { recursive: true, force: true });
        mkdirSync('./agent-signer-storage');
      });

      it('should mint capacity credits on test network', async () => {
        const walletInfo: WalletInfo = await agentSigner.createWallet({
          requestsPerKilosecond: 10,
          daysUntilUTCMidnightExpiration: 1,
        });
        expect(walletInfo.pkpInfo).toBeDefined();

        const capacityCreditId = AgentSigner.getCapacityCreditIdFromStorage();
        expect(capacityCreditId).toBeDefined();
        expect(capacityCreditId).not.toBeNull();
      }, 30000);
    });
  });
});
