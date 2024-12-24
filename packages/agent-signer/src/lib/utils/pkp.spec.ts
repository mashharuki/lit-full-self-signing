import { jest } from '@jest/globals';
import { ethers } from 'ethers';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';
import { Storage } from '../storage';
import {
  loadPkpFromStorage,
  createPkpWallet,
  permitLitAction,
  listPermittedActions,
} from './pkp';

jest.mock('@lit-protocol/contracts-sdk');

describe('PKP Utils', () => {
  let mockStorage: jest.Mocked<Storage>;
  let mockLitContracts: jest.Mocked<LitContracts>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };

    mockLitContracts = {
      pkpNftContractUtils: {
        write: {
          mint: jest.fn(),
        },
      },
      addPermittedAction: jest.fn(),
      pkpPermissionsContractUtils: {
        read: {
          getPermittedActions: jest.fn(),
        },
      },
    } as any;
  });

  describe('loadPkpFromStorage', () => {
    it('should load PKP info from storage', () => {
      const mockPkpInfo = {
        tokenId: '1',
        publicKey: '0x123',
        ethAddress: '0x456',
      };

      mockStorage.getItem.mockReturnValueOnce(JSON.stringify(mockPkpInfo));

      const result = loadPkpFromStorage(mockStorage);

      expect(result).toEqual(mockPkpInfo);
      expect(mockStorage.getItem).toHaveBeenCalledWith('pkp');
    });

    it('should return null if storage is empty', () => {
      mockStorage.getItem.mockReturnValueOnce(null);

      const result = loadPkpFromStorage(mockStorage);

      expect(result).toBeNull();
    });

    it('should handle invalid JSON', () => {
      mockStorage.getItem.mockReturnValueOnce('invalid json');

      const result = loadPkpFromStorage(mockStorage);

      expect(result).toBeNull();
    });
  });

  describe('createPkpWallet', () => {
    it('should create a new PKP wallet', async () => {
      const mockPkpInfo = {
        tokenId: '1',
        publicKey: '0x123',
        ethAddress: '0x456',
      };

      const mockMintResponse = {
        pkp: mockPkpInfo,
        tx: {} as ethers.ContractTransaction,
        res: {} as any,
      };

      mockLitContracts.pkpNftContractUtils.write.mint.mockResolvedValueOnce(
        mockMintResponse
      );

      const result = await createPkpWallet(mockLitContracts, mockStorage);

      expect(result).toEqual(mockMintResponse);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'pkp',
        JSON.stringify(mockPkpInfo)
      );
    });
  });

  describe('permitLitAction', () => {
    it('should permit a Lit Action', async () => {
      const mockPkpInfo = {
        tokenId: '1',
        publicKey: '0x123',
        ethAddress: '0x456',
      };

      await permitLitAction(mockLitContracts, mockPkpInfo, {
        ipfsCid: 'test-cid',
      });

      expect(mockLitContracts.addPermittedAction).toHaveBeenCalledWith({
        ipfsId: 'test-cid',
        authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
        pkpTokenId: '1',
      });
    });

    it('should permit a Lit Action with custom signing scopes', async () => {
      const mockPkpInfo = {
        tokenId: '1',
        publicKey: '0x123',
        ethAddress: '0x456',
      };

      await permitLitAction(mockLitContracts, mockPkpInfo, {
        ipfsCid: 'test-cid',
        signingScopes: [AUTH_METHOD_SCOPE.SignEcdsa],
      });

      expect(mockLitContracts.addPermittedAction).toHaveBeenCalledWith({
        ipfsId: 'test-cid',
        authMethodScopes: [AUTH_METHOD_SCOPE.SignEcdsa],
        pkpTokenId: '1',
      });
    });
  });

  describe('listPermittedActions', () => {
    it('should list all permitted actions', async () => {
      const mockPkpInfo = {
        tokenId: '1',
        publicKey: '0x123',
        ethAddress: '0x456',
      };

      const mockActions = ['action1', 'action2'];

      mockLitContracts.pkpPermissionsContractUtils.read.getPermittedActions.mockResolvedValueOnce(
        mockActions
      );

      const result = await listPermittedActions(mockLitContracts, mockPkpInfo);

      expect(result).toEqual(mockActions);
      expect(
        mockLitContracts.pkpPermissionsContractUtils.read.getPermittedActions
      ).toHaveBeenCalledWith('1');
    });
  });
});
