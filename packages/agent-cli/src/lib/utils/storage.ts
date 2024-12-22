import { LocalStorage } from 'node-localstorage';
import { existsSync, mkdirSync } from 'fs';

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
  /**
   * Store wallet information
   */
  storeWallet(wallet: StoredWallet) {
    localStorage.setItem('wallet', JSON.stringify(wallet));
  },

  /**
   * Retrieve stored wallet information
   */
  getWallet(): StoredWallet | null {
    const data = localStorage.getItem('wallet');
    if (!data) return null;
    return JSON.parse(data);
  },

  /**
   * Clear all stored data
   */
  clear() {
    localStorage.clear();
  },
};
