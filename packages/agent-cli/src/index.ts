import { AgentCLI } from './lib/agent-cli';

export async function startCli(): Promise<void> {
  const cli = new AgentCLI();
  await cli.start();
}

// Start CLI if this is the main module
if (require.main === module) {
  startCli().catch((error) => {
    console.error('Failed to start CLI:', error);
    process.exit(1);
  });
}
