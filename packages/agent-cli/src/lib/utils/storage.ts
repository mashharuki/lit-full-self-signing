import { LocalStorage } from 'node-localstorage';
import { existsSync, mkdirSync } from 'fs';
import { PkpInfo } from '@lit-protocol/agent-signer/src/lib/types';

// Initialize storage directory
const STORAGE_DIR = './.agent-cli-storage';
if (!existsSync(STORAGE_DIR)) {
  mkdirSync(STORAGE_DIR);
}

// Initialize local storage
const localStorage = new LocalStorage(STORAGE_DIR);

export interface StoredWallet {
  privateKey: string;
  address: string;
  timestamp: number;
}

export const storage = {
  storeWallet(wallet: StoredWallet) {
    localStorage.setItem('wallet', JSON.stringify(wallet));
  },

  getWallet(): StoredWallet | null {
    const data = localStorage.getItem('wallet');
    if (!data) return null;
    return JSON.parse(data);
  },

  storePkpInfo(pkpInfo: PkpInfo) {
    localStorage.setItem('pkpInfo', JSON.stringify(pkpInfo));
  },

  getPkpInfo(): PkpInfo | null {
    const data = localStorage.getItem('pkpInfo');
    if (!data) return null;
    return JSON.parse(data);
  },

  clear() {
    localStorage.clear();
  },
};
