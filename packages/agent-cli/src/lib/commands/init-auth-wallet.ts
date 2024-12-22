import { AgentSigner } from '@lit-protocol/agent-signer';
import { WalletManager } from '../wallet-manager';
import { logger } from '../utils/logger';

export async function initAuthWallet(): Promise<AgentSigner | null> {
  try {
    const walletManager = new WalletManager();
    const privateKey = await walletManager.getAuthPrivateKey();

    try {
      const signer = await AgentSigner.create(privateKey);
      logger.success(
        'Agent Auth Wallet initialization completed successfully!'
      );
      return signer;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Insufficient balance')
      ) {
        logger.warn('Your wallet does not have enough Lit test tokens.');
        logger.info(
          'Please get some using the faucet before continuing: https://chronicle-yellowstone-faucet.getlit.dev/'
        );
        return null;
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error initializing wallet: ' + error);
    return null;
  }
}
