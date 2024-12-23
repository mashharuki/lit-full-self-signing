import { LocalStorage } from 'node-localstorage';
import { join } from 'path';

export interface ChainConfig {
  rpcUrl: string;
  chainId: number;
}

export const DEFAULT_CHAINS: Record<string, ChainConfig> = {
  'Base Sepolia': {
    rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
    chainId: 84532,
  },
  'Base Mainnet': {
    rpcUrl: 'https://mainnet.base.org',
    chainId: 8453,
  },
};

class Storage {
  private CHAIN_CONFIG_STORAGE_KEY = 'chain_configs';
  private LAST_USED_CHAIN_KEY = 'last_used_chain';
  private localStorage: LocalStorage;

  constructor() {
    this.localStorage = new LocalStorage(
      join(process.cwd(), '.agent-cli-storage')
    );
  }

  getItem(key: string): string | null {
    return this.localStorage.getItem(key);
  }

  setItem(key: string, value: string | object): void {
    if (typeof value === 'object') {
      this.localStorage.setItem(key, JSON.stringify(value));
    } else {
      this.localStorage.setItem(key, value);
    }
  }

  removeItem(key: string): void {
    this.localStorage.removeItem(key);
  }

  clear(): void {
    this.localStorage.clear();
  }

  // Helper methods for storing objects
  getObject<T>(key: string): T | null {
    const value = this.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  setObject<T>(key: string, value: T): void {
    this.setItem(key, JSON.stringify(value));
  }

  // Specific methods for wallet storage
  getWallet(): { address: string; privateKey: string } | null {
    return this.getObject('wallet');
  }

  setWallet(wallet: { address: string; privateKey: string }): void {
    this.setObject('wallet', wallet);
  }

  getStoredChains(): Record<string, ChainConfig> {
    const stored = this.getItem(this.CHAIN_CONFIG_STORAGE_KEY);
    if (!stored) {
      this.setItem(this.CHAIN_CONFIG_STORAGE_KEY, DEFAULT_CHAINS);
      return DEFAULT_CHAINS;
    }
    return JSON.parse(stored);
  }

  saveChainConfig(name: string, config: ChainConfig): void {
    const chains = this.getStoredChains();
    chains[name] = config;
    this.setItem(this.CHAIN_CONFIG_STORAGE_KEY, chains);
  }

  getLastUsedChain(): string | null {
    return this.getItem(this.LAST_USED_CHAIN_KEY);
  }

  saveLastUsedChain(name: string): void {
    this.setItem(this.LAST_USED_CHAIN_KEY, name);
  }
}

export const storage = new Storage();
