import inquirer from 'inquirer';
import { storage } from '../utils/storage';

const OPENAI_KEY_STORAGE_KEY = 'openai_api_key';

export async function promptForOpenAIKey(): Promise<string> {
  // Check if key exists in storage
  const existingKey = storage.getItem(OPENAI_KEY_STORAGE_KEY);
  if (existingKey) {
    return existingKey;
  }

  // Prompt user for key
  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Please enter your OpenAI API key:',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'API key is required';
        }
        if (!input.startsWith('sk-')) {
          return 'Invalid API key format. Should start with "sk-"';
        }
        return true;
      },
    },
  ]);

  // Store the key
  storage.setItem(OPENAI_KEY_STORAGE_KEY, apiKey);
  return apiKey;
}
