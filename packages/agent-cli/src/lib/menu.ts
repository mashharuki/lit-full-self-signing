import inquirer from 'inquirer';
import { addTools } from './commands/add-tools';
import { AgentCLI } from './agent-cli';

export interface MenuChoice {
  name: string;
  value: string;
  handler: (cli: AgentCLI) => Promise<void>;
}

const menuChoices: MenuChoice[] = [
  {
    name: 'Add Tools to Agent Wallet',
    value: 'add-tools',
    handler: async (cli: AgentCLI) => {
      await addTools(cli.agentSigner!);
    },
  },
];

async function promptForChoice(): Promise<string> {
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
  return choice;
}

async function handleMenuChoice(choice: string, cli: AgentCLI): Promise<void> {
  if (choice === 'exit') {
    process.exit(0);
  }

  const selectedChoice = menuChoices.find((c) => c.value === choice);
  if (selectedChoice) {
    await selectedChoice.handler(cli);
  }
}

export async function showMainMenu(cli: AgentCLI): Promise<void> {
  while (true) {
    const choice = await promptForChoice();
    await handleMenuChoice(choice, cli);
  }
}
