import type { AuthSig, MintWithAuthResponse } from '@lit-protocol/types';
import type { ethers } from 'ethers';

export type PkpInfo = MintWithAuthResponse<ethers.ContractReceipt>['pkp'];

export type CapacityCreditMintOptions = {
  requestsPerKilosecond?: number;
  daysUntilUTCMidnightExpiration?: number;
};

export type CapacityCreditDelegationAuthSigOptions = {
  delegateeAddresses: string[];
  uses?: string;
  expiration?: string;
};

export type PkpSessionSigsOptions = {
  capacityDelegationAuthSig?: AuthSig;
  expiration?: string;
};

export type ExecuteJsParams = {
  jsParams: object;
} & ({ code: string; ipfsId?: never } | { code?: never; ipfsId: string });

/**
 * Options for setting a tool policy
 */
export interface SetToolPolicyOptions {
  /**
   * IPFS CID of the tool (must be CID v0)
   */
  ipfsCid: string;
  /**
   * Tool-specific policy data that will be ABI encoded
   */
  policy: any;
  /**
   * Version of the policy (e.g., "1.0.0")
   */
  version: string;
}

/**
 * Tool policy information returned from the registry
 */
export interface ToolPolicy {
  /**
   * ABI encoded policy data
   */
  policy: string;
  /**
   * Version of the policy
   */
  version: string;
}

/**
 * Registered tool information
 */
export interface RegisteredTools {
  /**
   * Array of IPFS CIDs for registered tools
   */
  ipfsCids: string[];
  /**
   * Array of ABI encoded policy data
   */
  policyData: string[];
  /**
   * Array of policy versions
   */
  versions: string[];
}
