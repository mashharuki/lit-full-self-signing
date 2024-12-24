import { jest } from '@jest/globals';
import { ethers } from 'ethers';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client-nodejs';
import { AgentSigner } from './agent-signer';
import { LocalStorageImpl } from './storage';
import * as utils from './utils';

// Mock the utility functions
jest.mock('./utils', () => ({
  loadPkpFromStorage: jest.fn(),
  createPkpWallet: jest.fn(),
  permitLitAction: jest.fn(),
  listPermittedActions: jest.fn(),
  loadCapacityCreditFromStorage: jest.fn(),
  requiresCapacityCredit: jest.fn(),
  mintCapacityCredit: jest.fn(),
  getCapacityCreditDelegationAuthSig: jest.fn(),
  getPkpSessionSigs: jest.fn(),
  createToolPolicyContract: jest.fn(),
  setToolPolicy: jest.fn(),
  removeToolPolicy: jest.fn(),
  getToolPolicy: jest.fn(),
  getRegisteredTools: jest.fn(),
}));

// Mock external dependencies
jest.mock('@lit-protocol/lit-node-client-nodejs');
jest.mock('@lit-protocol/contracts-sdk');
jest.mock('ethers');

describe('AgentSigner', () => {
  let mockLitNodeClient: jest.Mocked<LitNodeClientNodeJs>;
  let mockLitContracts: jest.Mocked<LitContracts>;
  let mockEthersWallet: jest.Mocked<ethers.Wallet>;
  let mockProvider: jest.Mocked<ethers.providers.JsonRpcProvider>;
  let mockContract: jest.Mocked<ethers.Contract>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock LitNodeClient
    mockLitNodeClient = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      pkpSign: jest.fn(),
      executeJs: jest.fn(),
      getLatestBlockhash: jest.fn(),
    } as any;

    // Setup mock provider and wallet
    mockProvider = {
      getBalance: jest.fn().mockResolvedValue(ethers.utils.parseEther('1')),
    } as any;

    mockEthersWallet = {
      provider: mockProvider,
      getBalance: jest.fn().mockResolvedValue(ethers.utils.parseEther('1')),
      getAddress: jest.fn().mockResolvedValue('0x123'),
    } as any;

    // Setup mock LitContracts
    mockLitContracts = {
      connect: jest.fn(),
      network: 'datilTest',
    } as any;

    // Setup mock Contract
    mockContract = {} as any;

    // Setup mock constructors
    (LitNodeClientNodeJs as jest.Mock).mockImplementation(
      () => mockLitNodeClient
    );
    (ethers.Wallet as jest.Mock).mockImplementation(() => mockEthersWallet);
    (LitContracts as jest.Mock).mockImplementation(() => mockLitContracts);
    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);
  });

  describe('create', () => {
    it('should initialize AgentSigner successfully', async () => {
      const agentSigner = await AgentSigner.create('0x123');

      expect(mockLitNodeClient.connect).toHaveBeenCalled();
      expect(mockLitContracts.connect).toHaveBeenCalled();
      expect(utils.loadPkpFromStorage).toHaveBeenCalled();
    });

    it('should throw error if wallet has insufficient balance', async () => {
      mockEthersWallet.getBalance.mockResolvedValueOnce(
        ethers.utils.parseEther('0.001')
      );

      await expect(AgentSigner.create('0x123')).rejects.toThrow(
        'Insufficient balance'
      );
    });
  });

  describe('createWallet', () => {
    let agentSigner: AgentSigner;

    beforeEach(async () => {
      agentSigner = await AgentSigner.create('0x123');
    });

    it('should create wallet and mint capacity credits', async () => {
      const mockPkpInfo = {
        tokenId: '1',
        publicKey: '0x456',
        ethAddress: '0x789',
      };

      (utils.createPkpWallet as jest.Mock).mockResolvedValueOnce({
        pkpInfo: mockPkpInfo,
      });

      await agentSigner.createWallet();

      expect(utils.createPkpWallet).toHaveBeenCalled();
      expect(utils.mintCapacityCredit).toHaveBeenCalled();
    });
  });

  describe('pkpSign', () => {
    let agentSigner: AgentSigner;

    beforeEach(async () => {
      agentSigner = await AgentSigner.create('0x123');
      await agentSigner.createWallet();
    });

    it('should sign data with PKP', async () => {
      const mockSessionSigs = { sig1: 'sig1' };
      const mockCapacityAuthSig = { sig: 'sig' };

      (utils.requiresCapacityCredit as jest.Mock).mockReturnValueOnce(true);
      (utils.loadCapacityCreditFromStorage as jest.Mock).mockReturnValueOnce(
        '1'
      );
      (
        utils.getCapacityCreditDelegationAuthSig as jest.Mock
      ).mockResolvedValueOnce(mockCapacityAuthSig);
      (utils.getPkpSessionSigs as jest.Mock).mockResolvedValueOnce(
        mockSessionSigs
      );
      mockLitNodeClient.pkpSign.mockResolvedValueOnce({ signature: '0x123' });

      const result = await agentSigner.pkpSign({ toSign: '0x123' });

      expect(result).toEqual({ signature: '0x123' });
      expect(utils.getPkpSessionSigs).toHaveBeenCalledWith(
        mockLitNodeClient,
        mockEthersWallet,
        { capacityDelegationAuthSig: mockCapacityAuthSig }
      );
    });
  });

  describe('tool policy methods', () => {
    let agentSigner: AgentSigner;

    beforeEach(async () => {
      agentSigner = await AgentSigner.create('0x123');
      await agentSigner.createWallet();
      await agentSigner.initToolPolicyRegistry('0x123');
    });

    it('should set tool policy', async () => {
      const options = {
        ipfsCid: 'cid',
        policy: 'policy',
        version: '1',
      };

      (utils.setToolPolicy as jest.Mock).mockResolvedValueOnce({
        hash: '0x123',
      });

      const result = await agentSigner.setToolPolicy(options);

      expect(result).toEqual({ hash: '0x123' });
      expect(utils.setToolPolicy).toHaveBeenCalledWith(
        mockContract,
        expect.any(String),
        expect.any(Function),
        mockProvider,
        options
      );
    });

    it('should remove tool policy', async () => {
      (utils.removeToolPolicy as jest.Mock).mockResolvedValueOnce({
        hash: '0x123',
      });

      const result = await agentSigner.removeToolPolicy('cid');

      expect(result).toEqual({ hash: '0x123' });
      expect(utils.removeToolPolicy).toHaveBeenCalled();
    });

    it('should get tool policy', async () => {
      const mockPolicy = { policy: 'policy', version: '1' };
      (utils.getToolPolicy as jest.Mock).mockResolvedValueOnce(mockPolicy);

      const result = await agentSigner.getToolPolicy('cid');

      expect(result).toEqual(mockPolicy);
      expect(utils.getToolPolicy).toHaveBeenCalled();
    });

    it('should get registered tools', async () => {
      const mockTools = {
        ipfsCids: ['cid1'],
        policyData: ['policy1'],
        versions: ['1'],
      };
      (utils.getRegisteredTools as jest.Mock).mockResolvedValueOnce(mockTools);

      const result = await agentSigner.getRegisteredTools();

      expect(result).toEqual(mockTools);
      expect(utils.getRegisteredTools).toHaveBeenCalled();
    });
  });
});
