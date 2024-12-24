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

const STORAGE_PATH = join(process.cwd(), '.agent-cli-storage');
const OPENAI_KEY_STORAGE_KEY = 'openai-key';
const TOOL_POLICY_REGISTRY_ADDRESS_KEY = 'tool-policy-registry-address';
const WALLET_STORAGE_KEY = 'auth-wallet';
const CHAIN_CONFIG_STORAGE_KEY = 'chain_configs';
const LAST_USED_CHAIN_KEY = 'last_used_chain';
const TOOL_POLICY_REGISTRY_CONFIG = 'tool_policy_registry_config';
const USE_DEFAULT_REGISTRY_KEY = 'use_default_registry';

export interface ToolPolicyRegistryConfig {
  rpcUrl: string;
  contractAddress: string;
}

class Storage {
  private localStorage: LocalStorage;

  constructor() {
    this.localStorage = new LocalStorage(STORAGE_PATH);
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

  getOpenAIKey(): string | null {
    return this.localStorage.getItem(OPENAI_KEY_STORAGE_KEY);
  }

  setOpenAIKey(key: string): void {
    this.localStorage.setItem(OPENAI_KEY_STORAGE_KEY, key);
  }

  getToolPolicyRegistryAddress(): string | null {
    return this.localStorage.getItem(TOOL_POLICY_REGISTRY_ADDRESS_KEY);
  }

  setToolPolicyRegistryAddress(address: string): void {
    this.localStorage.setItem(TOOL_POLICY_REGISTRY_ADDRESS_KEY, address);
  }

  getWallet(): { address: string; privateKey: string } | null {
    return this.getObject(WALLET_STORAGE_KEY);
  }

  setWallet(wallet: { address: string; privateKey: string }): void {
    this.setObject(WALLET_STORAGE_KEY, wallet);
  }

  getStoredChains(): Record<string, ChainConfig> {
    const stored = this.getItem(CHAIN_CONFIG_STORAGE_KEY);
    if (!stored) {
      this.setItem(CHAIN_CONFIG_STORAGE_KEY, DEFAULT_CHAINS);
      return DEFAULT_CHAINS;
    }
    return JSON.parse(stored);
  }

  saveChainConfig(name: string, config: ChainConfig): void {
    const chains = this.getStoredChains();
    chains[name] = config;
    this.setItem(CHAIN_CONFIG_STORAGE_KEY, chains);
  }

  getLastUsedChain(): string | null {
    return this.getItem(LAST_USED_CHAIN_KEY);
  }

  saveLastUsedChain(name: string): void {
    this.setItem(LAST_USED_CHAIN_KEY, name);
  }

  // Tool Policy Registry Config
  getToolPolicyRegistryConfig(): ToolPolicyRegistryConfig | null {
    const config = this.getItem(TOOL_POLICY_REGISTRY_CONFIG);
    return config ? JSON.parse(config) : null;
  }

  setToolPolicyRegistryConfig(config: ToolPolicyRegistryConfig): void {
    this.setItem(TOOL_POLICY_REGISTRY_CONFIG, JSON.stringify(config));
  }

  getUseDefaultRegistry(): boolean | null {
    const value = this.getItem(USE_DEFAULT_REGISTRY_KEY);
    return value ? value === 'true' : null;
  }

  setUseDefaultRegistry(useDefault: boolean): void {
    this.setItem(USE_DEFAULT_REGISTRY_KEY, useDefault.toString());
  }
}

export const storage = new Storage();
