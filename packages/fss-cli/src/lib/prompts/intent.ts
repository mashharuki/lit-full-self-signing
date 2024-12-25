import inquirer from 'inquirer';

export async function promptForUserIntent(): Promise<string> {
  const { intent } = await inquirer.prompt([
    {
      type: 'input',
      name: 'intent',
      message: 'What would you like to do?',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Please describe what you would like to do';
        }
        return true;
      },
    },
  ]);

  return intent.trim();
}
