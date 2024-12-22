import { LocalStorage } from 'node-localstorage';
import { StoredWallet } from '../wallet';

class Storage {
  private localStorage: LocalStorage;

  constructor() {
    this.localStorage = new LocalStorage('./.lit-agent-storage');
  }

  storeWallet(wallet: StoredWallet) {
    this.localStorage.setItem('wallet', JSON.stringify(wallet));
  }

  getWallet(): StoredWallet | null {
    const wallet = this.localStorage.getItem('wallet');
    if (wallet) {
      return JSON.parse(wallet);
    }
    return null;
  }
}

export const storage = new Storage();
