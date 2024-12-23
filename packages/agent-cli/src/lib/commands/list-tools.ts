import { AgentSigner } from '@lit-protocol/agent-signer';
import bs58 from 'bs58';
import {
  listAvailableTools,
  ToolInfo,
} from '@lit-protocol/agent-tool-registry';

import { logger } from '../utils/logger';

export interface PermittedTool extends ToolInfo {
  hexCid: string;
  base58Cid: string;
}

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

export async function getPermittedTools(
  agentSigner: AgentSigner
): Promise<PermittedTool[]> {
  const permittedActions = await agentSigner.pkpListPermittedActions();
  const availableTools = listAvailableTools();

  return permittedActions.map((action) => {
    const base58Cid = hexToBase58(action);
    const tool = findToolByIpfsCid(base58Cid, availableTools);

    if (tool) {
      return {
        ...tool,
        hexCid: action,
        base58Cid,
      };
    }

    // Return a minimal tool info for unknown tools
    return {
      name: 'Unknown Tool',
      description: 'This tool is not registered in the Lit Agent Tool Registry',
      ipfsCid: action,
      hexCid: action,
      base58Cid,
      parameters: [],
    };
  });
}

export async function listTools(agentSigner: AgentSigner): Promise<void> {
  logger.info('Fetching permitted tools for your agent wallet...');

  try {
    const permittedTools = await getPermittedTools(agentSigner);

    if (permittedTools.length === 0) {
      logger.info('No tools are currently permitted for your agent wallet.');
      return;
    }

    logger.info('Permitted tools:');
    permittedTools.forEach((tool, index) => {
      logger.log('\n' + '='.repeat(50));
      if (tool.name !== 'Unknown Tool') {
        logger.success(`Registered Tool (#${index + 1})`);
        logger.log(`Name: ${tool.name}`);
        logger.log(`Description: ${tool.description}`);
      } else {
        logger.warn(`Unknown Tool (#${index + 1})`);
        logger.log(tool.description);
      }
      logger.log(`IPFS CID (hex): ${tool.hexCid}`);
      logger.log(`IPFS CID (base58): ${tool.base58Cid}`);
      logger.log('='.repeat(50));
    });
  } catch (error) {
    logger.error(
      'Failed to fetch permitted tools: ' +
        (error instanceof Error ? error.message : String(error))
    );
  }
}
