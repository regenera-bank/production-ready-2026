#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const coreBankRoot = join(__dirname, '..');

process.env.LOAD_TEST_OPS = '50000';

const result = spawnSync(
  'npx',
  ['jest', '--runInBand', 'src/load/daily-load.spec.ts'],
  {
    cwd: coreBankRoot,
    stdio: 'inherit',
    env: process.env,
  },
);

process.exit(result.status ?? 1);