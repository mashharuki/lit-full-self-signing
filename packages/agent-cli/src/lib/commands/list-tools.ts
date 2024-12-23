import { AgentSigner } from '@lit-protocol/agent-signer';
import bs58 from 'bs58';
import {
  listAvailableTools,
  ToolInfo,
} from '@lit-protocol/agent-tool-registry';

import { logger } from '../utils/logger';

function hexToBase58(hexCid: string): string {
  // Remove '0x' prefix if present
  const cleanHex = hexCid.startsWith('0x') ? hexCid.slice(2) : hexCid;
  // Convert hex string to bytes
  const bytes = Buffer.from(cleanHex, 'hex');
  // Convert bytes to base58
  return bs58.encode(bytes);
}

function findToolByIpfsCid(
  cid: string,
  tools: ToolInfo[]
): ToolInfo | undefined {
  // Try both hex and base58 formats
  return tools.find(
    (tool) =>
      tool.ipfsCid === cid ||
      tool.ipfsCid === `0x${cid}` ||
      hexToBase58(tool.ipfsCid) === cid
  );
}

export async function listTools(agentSigner: AgentSigner): Promise<void> {
  logger.info('Fetching permitted tools for your agent wallet...');

  try {
    const permittedActions = await agentSigner.pkpListPermittedActions();
    const availableTools = listAvailableTools();

    if (permittedActions.length === 0) {
      logger.info('No tools are currently permitted for your agent wallet.');
      return;
    }

    logger.info('Permitted tools:');
    permittedActions.forEach((action, index) => {
      const base58Cid = hexToBase58(action);
      const tool = findToolByIpfsCid(base58Cid, availableTools);

      logger.log('\n' + '='.repeat(50));
      if (tool) {
        logger.success(`Registered Tool (#${index + 1})`);
        logger.log(`Name: ${tool.name}`);
        logger.log(`Description: ${tool.description}`);
      } else {
        logger.warn(`Unknown Tool (#${index + 1})`);
        logger.log(
          'This tool is not registered in the Lit Agent Tool Registry'
        );
      }
      logger.log(`IPFS CID (hex): ${action}`);
      logger.log(`IPFS CID (base58): ${base58Cid}`);
      logger.log('='.repeat(50));
    });
  } catch (error) {
    logger.error(
      'Failed to fetch permitted tools: ' +
        (error instanceof Error ? error.message : String(error))
    );
  }
}
