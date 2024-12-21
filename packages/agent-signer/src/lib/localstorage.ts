import { LocalStorage } from 'node-localstorage';

// Initialize local storage
const localStorage = new LocalStorage('./lit-agent-signer-session-storage');

// Use localStorage directly in your code
export { localStorage };
