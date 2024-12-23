#!/usr/bin/env node

import { startCli } from './index';

startCli().catch((error) => {
  console.error('Failed to start CLI:', error);
  process.exit(1);
});
