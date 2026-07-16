#!/usr/bin/env node
import { readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(root, '../src');
const distRoot = join(root, '../dist');

const removeCompiled = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      removeCompiled(full);
      continue;
    }
    if (/\.(js|d\.ts|js\.map)$/.test(entry)) {
      rmSync(full);
    }
  }
};

rmSync(distRoot, { recursive: true, force: true });
removeCompiled(srcRoot);
console.log('web-bff: artefatos compilados removidos');