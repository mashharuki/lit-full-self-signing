import { LocalStorage } from 'node-localstorage';
import { join } from 'path';

class Storage {
  private localStorage: LocalStorage;

  constructor() {
    this.localStorage = new LocalStorage(
      join(process.cwd(), '.agent-cli-storage')
    );
  }

  getItem(key: string): string | null {
    return this.localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.localStorage.setItem(key, value);
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
}

export const storage = new Storage();
