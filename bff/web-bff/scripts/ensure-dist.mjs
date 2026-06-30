#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const mainJs = join(root, '../dist/main.js');

if (!existsSync(mainJs)) {
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: join(root, '..'),
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}