import { z } from 'zod';
import {
  BaseAgentToolPolicy,
  BaseLitActionPolicySchema,
  registerPolicy,
  validatePolicy,
  encodePolicy,
  decodePolicy,
  BaseEthereumAddressSchema,
} from './fss-tool-policy';

describe('fss-tool-policy', () => {
  // Example test policy
  interface TestPolicy extends BaseAgentToolPolicy {
    type: 'TestPolicy';
    name: string;
    value: number;
  }

  const TestPolicySchema = BaseLitActionPolicySchema.extend({
    type: z.literal('TestPolicy'),
    name: z.string(),
    value: z.number(),
  });

  const mockEncode = (policy: TestPolicy): string => {
    return JSON.stringify(policy);
  };

  const mockDecode = (encoded: string, version: string): TestPolicy => {
    const decoded = JSON.parse(encoded);
    return { ...decoded, version };
  };

  beforeEach(() => {
    // Register a test policy before each test
    registerPolicy<TestPolicy>('TestPolicy', {
      schema: TestPolicySchema,
      encode: mockEncode,
      decode: mockDecode,
    });
  });

  describe('BaseEthereumAddressSchema', () => {
    it('should validate correct Ethereum addresses', () => {
      const validAddress = '0x1234567890123456789012345678901234567890';
      expect(() => BaseEthereumAddressSchema.parse(validAddress)).not.toThrow();
    });

    it('should reject invalid Ethereum addresses', () => {
      const invalidAddresses = [
        '0x123', // too short
        '0xGGGG567890123456789012345678901234567890', // invalid characters
        '1234567890123456789012345678901234567890', // missing 0x prefix
      ];

      invalidAddresses.forEach((address) => {
        expect(() => BaseEthereumAddressSchema.parse(address)).toThrow();
      });
    });
  });

  describe('Policy Registration and Validation', () => {
    it('should successfully register and validate a policy', () => {
      const validPolicy: TestPolicy = {
        type: 'TestPolicy',
        version: '1.0.0',
        name: 'Test',
        value: 42,
      };

      const validated = validatePolicy<TestPolicy>('TestPolicy', validPolicy);
      expect(validated).toEqual(validPolicy);
    });

    it('should throw error for unregistered policy type', () => {
      expect(() => validatePolicy('UnregisteredPolicy', {})).toThrowError(
        /No policy definition found/
      );
    });

    it('should throw error for invalid policy data', () => {
      const invalidPolicy = {
        type: 'TestPolicy',
        version: '1.0.0',
        name: 123, // should be string
        value: '42', // should be number
      };

      expect(() =>
        validatePolicy<TestPolicy>('TestPolicy', invalidPolicy)
      ).toThrow();
    });
  });

  describe('Policy Encoding and Decoding', () => {
    const testPolicy: TestPolicy = {
      type: 'TestPolicy',
      version: '1.0.0',
      name: 'Test',
      value: 42,
    };

    it('should successfully encode a policy', () => {
      const encoded = encodePolicy('TestPolicy', testPolicy);
      expect(encoded).toBe(JSON.stringify(testPolicy));
    });

    it('should successfully decode a policy', () => {
      const encoded = JSON.stringify(testPolicy);
      const decoded = decodePolicy<TestPolicy>(
        'TestPolicy',
        encoded,
        testPolicy.version
      );
      expect(decoded).toEqual(testPolicy);
    });

    it('should throw error when encoding unregistered policy', () => {
      expect(() => encodePolicy('UnregisteredPolicy', testPolicy)).toThrowError(
        /No policy definition found/
      );
    });

    it('should throw error when decoding unregistered policy', () => {
      expect(() =>
        decodePolicy('UnregisteredPolicy', '{}', '1.0.0')
      ).toThrowError(/No policy definition found/);
    });
  });

  describe('Base Policy Schema', () => {
    it('should require type and version fields', () => {
      const validPolicy = {
        type: 'TestPolicy',
        version: '1.0.0',
      };

      expect(() => BaseLitActionPolicySchema.parse(validPolicy)).not.toThrow();
    });

    it('should reject policies missing required fields', () => {
      const invalidPolicies = [
        { type: 'TestPolicy' }, // missing version
        { version: '1.0.0' }, // missing type
        {}, // missing both
      ];

      invalidPolicies.forEach((policy) => {
        expect(() => BaseLitActionPolicySchema.parse(policy)).toThrow();
      });
    });
  });
});
