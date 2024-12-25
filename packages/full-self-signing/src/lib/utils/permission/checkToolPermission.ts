import { AgentSigner } from '@lit-protocol/fss-signer';
import type { ToolInfo } from '@lit-protocol/fss-tool-registry';
import bs58 from 'bs58';

function hexToBase58(hex: string): string {
  // Remove '0x' prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  // Convert hex string to bytes
  const bytes = Buffer.from(cleanHex, 'hex');
  // Convert bytes to base58
  return bs58.encode(bytes);
}

export async function checkToolPermission(
  signer: AgentSigner,
  tool: ToolInfo
): Promise<boolean> {
  const permittedActions = await signer.pkpListPermittedActions();
  // Convert each hex string to base58 and check if it matches the tool's ipfsCid
  return permittedActions.some(
    (action) => hexToBase58(action) === tool.ipfsCid
  );
}
