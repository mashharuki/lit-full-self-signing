import { LocalStorage } from 'node-localstorage';

// Initialize local storage
const localStorage = new LocalStorage('./agent-signer-storage');

// Use localStorage directly in your code
export { localStorage };
