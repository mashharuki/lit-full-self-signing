import { LocalStorage } from 'node-localstorage';

/**
 * Storage interface for the agent signer
 */
export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * Node.js local storage implementation
 */
export class LocalStorageImpl implements Storage {
  private storage: LocalStorage;

  constructor() {
    this.storage = new LocalStorage('./.agent-signer-storage');
  }

  getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.storage.setItem(key, value);
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }
}
