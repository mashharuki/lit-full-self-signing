import { jest } from '@jest/globals';
import { ethers } from 'ethers';
import type { SigResponse } from '@lit-protocol/types';
import {
  createToolPolicyContract,
  setToolPolicy,
  removeToolPolicy,
  getToolPolicy,
  getRegisteredTools,
} from './tool-policies';

jest.mock('ethers');

describe('Tool Policies Utils', () => {
  let mockContract: jest.Mocked<ethers.Contract>;
  let mockProvider: jest.Mocked<ethers.providers.Provider>;
  let mockSignCallback: jest.Mock<Promise<SigResponse>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContract = {
      address: '0x123',
      interface: {
        encodeFunctionData: jest.fn(),
      },
      getActionPolicy: jest.fn(),
      getRegisteredActions: jest.fn(),
    } as any;

    mockProvider = {
      sendTransaction: jest.fn(),
    } as any;

    mockSignCallback = jest.fn();

    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);
    (ethers.utils.defaultAbiCoder.encode as jest.Mock).mockReturnValue(
      '0xencoded'
    );
    (ethers.utils.keccak256 as jest.Mock).mockReturnValue('0xhash');
    (ethers.utils.serializeTransaction as jest.Mock).mockReturnValue(
      '0xserialized'
    );
  });

  describe('createToolPolicyContract', () => {
    it('should create a contract instance', () => {
      const result = createToolPolicyContract('0x123', mockProvider);

      expect(ethers.Contract).toHaveBeenCalledWith(
        '0x123',
        expect.any(Array),
        mockProvider
      );
      expect(result).toBe(mockContract);
    });
  });

  describe('setToolPolicy', () => {
    it('should set a tool policy', async () => {
      const options = {
        ipfsCid: 'cid',
        policy: 'policy',
        version: '1',
      };

      mockContract.interface.encodeFunctionData.mockReturnValueOnce('0xdata');
      mockSignCallback.mockResolvedValueOnce({ signature: '0xsig' });
      mockProvider.sendTransaction.mockResolvedValueOnce({
        hash: '0xtx',
      } as ethers.ContractTransaction);

      const result = await setToolPolicy(
        mockContract,
        '0x456',
        mockSignCallback,
        mockProvider,
        options
      );

      expect(result).toEqual({ hash: '0xtx' });
      expect(mockContract.interface.encodeFunctionData).toHaveBeenCalledWith(
        'setActionPolicy',
        ['cid', '0xencoded', '1']
      );
      expect(mockSignCallback).toHaveBeenCalledWith('0xhash');
      expect(mockProvider.sendTransaction).toHaveBeenCalledWith('0xserialized');
    });

    it('should handle object policies', async () => {
      const options = {
        ipfsCid: 'cid',
        policy: { key: 'value' },
        version: '1',
      };

      mockContract.interface.encodeFunctionData.mockReturnValueOnce('0xdata');
      mockSignCallback.mockResolvedValueOnce({ signature: '0xsig' });
      mockProvider.sendTransaction.mockResolvedValueOnce({
        hash: '0xtx',
      } as ethers.ContractTransaction);

      await setToolPolicy(
        mockContract,
        '0x456',
        mockSignCallback,
        mockProvider,
        options
      );

      expect(ethers.utils.defaultAbiCoder.encode).toHaveBeenCalledWith(
        ['tuple'],
        [{ key: 'value' }]
      );
    });
  });

  describe('removeToolPolicy', () => {
    it('should remove a tool policy', async () => {
      mockContract.interface.encodeFunctionData.mockReturnValueOnce('0xdata');
      mockSignCallback.mockResolvedValueOnce({ signature: '0xsig' });
      mockProvider.sendTransaction.mockResolvedValueOnce({
        hash: '0xtx',
      } as ethers.ContractTransaction);

      const result = await removeToolPolicy(
        mockContract,
        '0x456',
        mockSignCallback,
        mockProvider,
        'cid'
      );

      expect(result).toEqual({ hash: '0xtx' });
      expect(mockContract.interface.encodeFunctionData).toHaveBeenCalledWith(
        'removeActionPolicy',
        ['cid']
      );
      expect(mockSignCallback).toHaveBeenCalledWith('0xhash');
      expect(mockProvider.sendTransaction).toHaveBeenCalledWith('0xserialized');
    });
  });

  describe('getToolPolicy', () => {
    it('should get a tool policy', async () => {
      const mockPolicy = {
        policy: '0xpolicy',
        version: '1',
      };

      mockContract.getActionPolicy.mockResolvedValueOnce([
        mockPolicy.policy,
        mockPolicy.version,
      ]);

      const result = await getToolPolicy(mockContract, '0x456', 'cid');

      expect(result).toEqual(mockPolicy);
      expect(mockContract.getActionPolicy).toHaveBeenCalledWith('0x456', 'cid');
    });
  });

  describe('getRegisteredTools', () => {
    it('should get all registered tools', async () => {
      const mockTools = {
        ipfsCids: ['cid1', 'cid2'],
        policyData: ['0xpolicy1', '0xpolicy2'],
        versions: ['1', '2'],
      };

      mockContract.getRegisteredActions.mockResolvedValueOnce([
        mockTools.ipfsCids,
        mockTools.policyData,
        mockTools.versions,
      ]);

      const result = await getRegisteredTools(mockContract, '0x456');

      expect(result).toEqual(mockTools);
      expect(mockContract.getRegisteredActions).toHaveBeenCalledWith('0x456');
    });
  });
});
