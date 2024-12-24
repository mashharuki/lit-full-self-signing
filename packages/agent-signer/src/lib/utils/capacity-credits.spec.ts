import { jest } from '@jest/globals';
import { ethers } from 'ethers';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client-nodejs';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { Storage } from '../storage';
import {
  loadCapacityCreditFromStorage,
  requiresCapacityCredit,
  mintCapacityCredit,
  getCapacityCreditDelegationAuthSig,
} from './capacity-credits';

jest.mock('@lit-protocol/contracts-sdk');
jest.mock('@lit-protocol/lit-node-client-nodejs');

describe('Capacity Credits Utils', () => {
  let mockStorage: jest.Mocked<Storage>;
  let mockLitContracts: jest.Mocked<LitContracts>;
  let mockLitNodeClient: jest.Mocked<LitNodeClientNodeJs>;
  let mockEthersWallet: jest.Mocked<ethers.Wallet>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };

    mockLitContracts = {
      network: LIT_NETWORK.DatilTest,
      mintCapacityCreditsNFT: jest.fn(),
    } as any;

    mockLitNodeClient = {
      createCapacityDelegationAuthSig: jest.fn(),
    } as any;

    mockEthersWallet = {
      getAddress: jest.fn().mockResolvedValue('0x123'),
    } as any;
  });

  describe('loadCapacityCreditFromStorage', () => {
    it('should load capacity credit ID from storage', () => {
      mockStorage.getItem.mockReturnValueOnce('123');

      const result = loadCapacityCreditFromStorage(mockStorage);

      expect(result).toBe('123');
      expect(mockStorage.getItem).toHaveBeenCalledWith('capacityCreditId');
    });

    it('should return null if storage is empty', () => {
      mockStorage.getItem.mockReturnValueOnce(null);

      const result = loadCapacityCreditFromStorage(mockStorage);

      expect(result).toBeNull();
    });

    it('should handle storage errors', () => {
      mockStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const result = loadCapacityCreditFromStorage(mockStorage);

      expect(result).toBeNull();
    });
  });

  describe('requiresCapacityCredit', () => {
    it('should return true for DatilTest network', () => {
      mockLitContracts.network = LIT_NETWORK.DatilTest;

      const result = requiresCapacityCredit(mockLitContracts);

      expect(result).toBe(true);
    });

    it('should return true for Datil network', () => {
      mockLitContracts.network = LIT_NETWORK.Datil;

      const result = requiresCapacityCredit(mockLitContracts);

      expect(result).toBe(true);
    });

    it('should return false for other networks', () => {
      mockLitContracts.network = LIT_NETWORK.Cayenne;

      const result = requiresCapacityCredit(mockLitContracts);

      expect(result).toBe(false);
    });
  });

  describe('mintCapacityCredit', () => {
    it('should mint capacity credits on supported networks', async () => {
      const mockCapacityCreditInfo = {
        capacityTokenIdStr: '123',
      };

      mockLitContracts.network = LIT_NETWORK.DatilTest;
      mockLitContracts.mintCapacityCreditsNFT.mockResolvedValueOnce(
        mockCapacityCreditInfo
      );

      const result = await mintCapacityCredit(mockLitContracts, mockStorage);

      expect(result).toBe('123');
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'capacityCreditId',
        '123'
      );
      expect(mockLitContracts.mintCapacityCreditsNFT).toHaveBeenCalledWith({
        requestsPerKilosecond: 10,
        daysUntilUTCMidnightExpiration: 1,
      });
    });

    it('should not mint capacity credits on unsupported networks', async () => {
      mockLitContracts.network = LIT_NETWORK.Cayenne;

      const result = await mintCapacityCredit(mockLitContracts, mockStorage);

      expect(result).toBeNull();
      expect(mockLitContracts.mintCapacityCreditsNFT).not.toHaveBeenCalled();
    });

    it('should use custom minting options', async () => {
      const mockCapacityCreditInfo = {
        capacityTokenIdStr: '123',
      };

      mockLitContracts.network = LIT_NETWORK.DatilTest;
      mockLitContracts.mintCapacityCreditsNFT.mockResolvedValueOnce(
        mockCapacityCreditInfo
      );

      await mintCapacityCredit(mockLitContracts, mockStorage, {
        requestsPerKilosecond: 20,
        daysUntilUTCMidnightExpiration: 2,
      });

      expect(mockLitContracts.mintCapacityCreditsNFT).toHaveBeenCalledWith({
        requestsPerKilosecond: 20,
        daysUntilUTCMidnightExpiration: 2,
      });
    });
  });

  describe('getCapacityCreditDelegationAuthSig', () => {
    it('should get delegation auth signature', async () => {
      const mockAuthSig = { sig: 'sig123' };
      const mockResult = {
        capacityDelegationAuthSig: mockAuthSig,
      };

      mockLitNodeClient.createCapacityDelegationAuthSig.mockResolvedValueOnce(
        mockResult
      );

      const result = await getCapacityCreditDelegationAuthSig(
        mockLitNodeClient,
        mockEthersWallet,
        '123',
        {
          delegateeAddresses: ['0x456'],
        }
      );

      expect(result).toEqual(mockAuthSig);
      expect(
        mockLitNodeClient.createCapacityDelegationAuthSig
      ).toHaveBeenCalledWith({
        dAppOwnerWallet: mockEthersWallet,
        capacityTokenId: '123',
        delegateeAddresses: ['0x456'],
        uses: '1',
        expiration: expect.any(String),
      });
    });

    it('should use custom options', async () => {
      const mockAuthSig = { sig: 'sig123' };
      const mockResult = {
        capacityDelegationAuthSig: mockAuthSig,
      };

      mockLitNodeClient.createCapacityDelegationAuthSig.mockResolvedValueOnce(
        mockResult
      );

      const expiration = new Date().toISOString();

      await getCapacityCreditDelegationAuthSig(
        mockLitNodeClient,
        mockEthersWallet,
        '123',
        {
          delegateeAddresses: ['0x456'],
          uses: '2',
          expiration,
        }
      );

      expect(
        mockLitNodeClient.createCapacityDelegationAuthSig
      ).toHaveBeenCalledWith({
        dAppOwnerWallet: mockEthersWallet,
        capacityTokenId: '123',
        delegateeAddresses: ['0x456'],
        uses: '2',
        expiration,
      });
    });
  });
});
