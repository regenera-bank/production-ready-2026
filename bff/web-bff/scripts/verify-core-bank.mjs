#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../domains/core-bank/dist');
const required = [
  'public-api.js',
  'core-bank.module.js',
  'core-bank.service.js',
];

const missing = required.filter((file) => !existsSync(join(root, file)));
if (missing.length > 0) {
  console.error('core-bank dist incompleto. Arquivos ausentes:', missing.join(', '));
  console.error('Rode: cd domains/core-bank && npm run build');
  process.exit(1);
}

console.log('core-bank dist OK:', required.join(', '));