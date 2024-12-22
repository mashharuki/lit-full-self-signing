import { startCLI } from './lib/agent-cli';

// Run the CLI when this file is executed directly
if (require.main === module) {
  startCLI();
}
