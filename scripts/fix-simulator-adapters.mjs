#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'domains');

for (const domain of fs.readdirSync(ROOT)) {
  const file = path.join(ROOT, domain, 'src', 'adapters', 'simulator', `${domain}-simulator.adapter.ts`);
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const broken = 'referenceId: `sim-${domain}-${command.idempotencyKey}`';
  const fixed = `referenceId: \`sim-${domain}-\${command.idempotencyKey}\``;
  if (content.includes(broken)) {
    fs.writeFileSync(file, content.replace(broken, fixed));
    console.log('fixed', domain);
  }
}