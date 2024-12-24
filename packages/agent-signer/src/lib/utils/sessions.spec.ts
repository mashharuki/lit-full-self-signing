import { jest } from '@jest/globals';
import { ethers } from 'ethers';
import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client-nodejs';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { LitActionResource, LitPKPResource } from '@lit-protocol/auth-helpers';
import { getPkpSessionSigs } from './sessions';

jest.mock('@lit-protocol/lit-node-client-nodejs');
jest.mock('@lit-protocol/auth-helpers', () => ({
  generateAuthSig: jest.fn(),
  createSiweMessage: jest.fn(),
  LitActionResource: jest.fn(),
  LitPKPResource: jest.fn(),
}));

describe('Sessions Utils', () => {
  let mockLitNodeClient: jest.Mocked<LitNodeClientNodeJs>;
  let mockEthersWallet: jest.Mocked<ethers.Wallet>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLitNodeClient = {
      getSessionSigs: jest.fn(),
      getLatestBlockhash: jest.fn(),
    } as any;

    mockEthersWallet = {
      getAddress: jest.fn().mockResolvedValue('0x123'),
    } as any;

    (LitActionResource as jest.Mock).mockImplementation((value) => ({
      value,
      toString: () => value,
    }));
    (LitPKPResource as jest.Mock).mockImplementation((value) => ({
      value,
      toString: () => value,
    }));
  });

  describe('getPkpSessionSigs', () => {
    it('should get session signatures without capacity delegation', async () => {
      const mockSessionSigs = { sig1: 'sig1' };
      const mockAuthSig = { sig: 'sig123' };
      const mockSiweMessage = 'siwe message';

      mockLitNodeClient.getLatestBlockhash.mockResolvedValueOnce('blockhash');
      mockLitNodeClient.getSessionSigs.mockResolvedValueOnce(mockSessionSigs);

      const createSiweMessage =
        require('@lit-protocol/auth-helpers').createSiweMessage;
      createSiweMessage.mockResolvedValueOnce(mockSiweMessage);

      const generateAuthSig =
        require('@lit-protocol/auth-helpers').generateAuthSig;
      generateAuthSig.mockResolvedValueOnce(mockAuthSig);

      const result = await getPkpSessionSigs(
        mockLitNodeClient,
        mockEthersWallet,
        {}
      );

      expect(result).toEqual(mockSessionSigs);
      expect(mockLitNodeClient.getSessionSigs).toHaveBeenCalledWith({
        chain: 'ethereum',
        expiration: expect.any(String),
        resourceAbilityRequests: [
          {
            resource: expect.any(Object),
            ability: LIT_ABILITY.LitActionExecution,
          },
          {
            resource: expect.any(Object),
            ability: LIT_ABILITY.PKPSigning,
          },
        ],
        authNeededCallback: expect.any(Function),
      });
    });

    it('should get session signatures with capacity delegation', async () => {
      const mockSessionSigs = { sig1: 'sig1' };
      const mockAuthSig = { sig: 'sig123' };
      const mockCapacityAuthSig = { sig: 'capacity123' };
      const mockSiweMessage = 'siwe message';

      mockLitNodeClient.getLatestBlockhash.mockResolvedValueOnce('blockhash');
      mockLitNodeClient.getSessionSigs.mockResolvedValueOnce(mockSessionSigs);

      const createSiweMessage =
        require('@lit-protocol/auth-helpers').createSiweMessage;
      createSiweMessage.mockResolvedValueOnce(mockSiweMessage);

      const generateAuthSig =
        require('@lit-protocol/auth-helpers').generateAuthSig;
      generateAuthSig.mockResolvedValueOnce(mockAuthSig);

      const result = await getPkpSessionSigs(
        mockLitNodeClient,
        mockEthersWallet,
        {
          capacityDelegationAuthSig: mockCapacityAuthSig,
        }
      );

      expect(result).toEqual(mockSessionSigs);
      expect(mockLitNodeClient.getSessionSigs).toHaveBeenCalledWith({
        chain: 'ethereum',
        expiration: expect.any(String),
        capabilityAuthSigs: [mockCapacityAuthSig],
        resourceAbilityRequests: [
          {
            resource: expect.any(Object),
            ability: LIT_ABILITY.LitActionExecution,
          },
          {
            resource: expect.any(Object),
            ability: LIT_ABILITY.PKPSigning,
          },
        ],
        authNeededCallback: expect.any(Function),
      });
    });

    it('should use custom expiration', async () => {
      const mockSessionSigs = { sig1: 'sig1' };
      const mockAuthSig = { sig: 'sig123' };
      const mockSiweMessage = 'siwe message';
      const expiration = new Date().toISOString();

      mockLitNodeClient.getLatestBlockhash.mockResolvedValueOnce('blockhash');
      mockLitNodeClient.getSessionSigs.mockResolvedValueOnce(mockSessionSigs);

      const createSiweMessage =
        require('@lit-protocol/auth-helpers').createSiweMessage;
      createSiweMessage.mockResolvedValueOnce(mockSiweMessage);

      const generateAuthSig =
        require('@lit-protocol/auth-helpers').generateAuthSig;
      generateAuthSig.mockResolvedValueOnce(mockAuthSig);

      await getPkpSessionSigs(mockLitNodeClient, mockEthersWallet, {
        expiration,
      });

      expect(mockLitNodeClient.getSessionSigs).toHaveBeenCalledWith(
        expect.objectContaining({
          expiration,
        })
      );
    });

    it('should handle auth callback correctly', async () => {
      const mockSessionSigs = { sig1: 'sig1' };
      const mockAuthSig = { sig: 'sig123' };
      const mockSiweMessage = 'siwe message';

      mockLitNodeClient.getLatestBlockhash.mockResolvedValueOnce('blockhash');
      mockLitNodeClient.getSessionSigs.mockImplementationOnce(
        async ({ authNeededCallback }) => {
          await authNeededCallback({
            uri: 'test-uri',
            expiration: new Date().toISOString(),
            resourceAbilityRequests: [],
          });
          return mockSessionSigs;
        }
      );

      const createSiweMessage =
        require('@lit-protocol/auth-helpers').createSiweMessage;
      createSiweMessage.mockResolvedValueOnce(mockSiweMessage);

      const generateAuthSig =
        require('@lit-protocol/auth-helpers').generateAuthSig;
      generateAuthSig.mockResolvedValueOnce(mockAuthSig);

      const result = await getPkpSessionSigs(
        mockLitNodeClient,
        mockEthersWallet,
        {}
      );

      expect(result).toEqual(mockSessionSigs);
      expect(createSiweMessage).toHaveBeenCalled();
      expect(generateAuthSig).toHaveBeenCalledWith({
        signer: mockEthersWallet,
        toSign: mockSiweMessage,
      });
    });
  });
});
