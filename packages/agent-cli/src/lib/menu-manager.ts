import inquirer from 'inquirer';
import { AgentSigner } from '@lit-protocol/agent-signer';
import { initAuthWallet } from './commands/init-auth-wallet';
import { initAgentWallet } from './commands/init-agent-wallet';
import { addTools } from './commands/add-tools';

export interface MenuChoice {
  name: string;
  value: string;
  handler: (agentSigner: AgentSigner | null) => Promise<AgentSigner | null>;
}

export const menuChoices: MenuChoice[] = [
  {
    name: 'Initialize Agent Auth Wallet',
    value: 'init-auth-wallet',
    handler: initAuthWallet,
  },
  {
    name: 'Initialize Agent Wallet',
    value: 'init-agent-wallet',
    handler: initAgentWallet,
  },
  {
    name: 'Add Tools to Agent Wallet',
    value: 'add-tools',
    handler: addTools,
  },
];

export class MenuManager {
  private agentSigner: AgentSigner | null = null;

  async showMainMenu(): Promise<void> {
    while (true) {
      const { choice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          message: 'What would you like to do?',
          choices: [
            ...menuChoices.map(({ name, value }) => ({ name, value })),
            { name: 'Exit', value: 'exit' },
          ],
        },
      ]);

      if (choice === 'exit') {
        process.exit(0);
      }

      const selectedChoice = menuChoices.find((c) => c.value === choice);
      if (selectedChoice) {
        this.agentSigner = await selectedChoice.handler(this.agentSigner);
      }
    }
  }
}
