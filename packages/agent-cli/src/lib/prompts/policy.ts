import type { ToolInfo } from '@lit-protocol/agent-tool-registry';
import { logger } from '../utils/logger';
import { ethers } from 'ethers';

export function displayToolPolicy(
  tool: ToolInfo,
  currentPolicy: any | null
): void {
  if (!currentPolicy) {
    return;
  }

  logger.info('Current Tool Policy:');
  logger.log(`Tool: ${tool.name}`);

  Object.entries(currentPolicy).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      logger.log(`${key}: ${value.length ? value.join(', ') : 'Any'}`);
    } else if (
      key.toLowerCase().startsWith('max') &&
      typeof value === 'string'
    ) {
      logger.log(`${key}: ${ethers.utils.formatEther(value)} ETH`);
    } else {
      logger.log(`${key}: ${value}`);
    }
  });
}

// Re-export the policy configuration function for backward compatibility
export { promptForToolPolicy } from './policy-config';
