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
