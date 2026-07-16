#!/usr/bin/env node
/**
 * Bundle Fastify entry — tsc não resolve imports .ts em ESM (npm start quebrava).
 * Alinhado ao Dockerfile.mobile-bff (esbuild).
 */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'server.js');
mkdirSync(dirname(out), { recursive: true });

const run = spawnSync(
  'npx',
  [
    '--yes',
    'esbuild@0.25.5',
    'src/server.ts',
    '--bundle',
    '--platform=node',
    '--target=node20',
    `--outfile=${out}`,
    '--format=esm',
    '--packages=external',
  ],
  { cwd: root, stdio: 'inherit' },
);

if (run.status !== 0) {
  process.exit(run.status ?? 1);
}

if (!existsSync(out)) {
  console.error('missing dist/server.js — build não emitiu');
  process.exit(1);
}

console.log('[mobile-bff] dist/server.js OK');