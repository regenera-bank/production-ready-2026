import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const resolveEnvPath = (): string => {
  const override = process.env.ENV_FILE?.trim();
  if (override) {
    return resolve(override);
  }
  return resolve(__dirname, '..', '.env');
};

/** Carrega bff/web-bff/.env sem dependência extra (Nest não lê .env sozinho). */
export const loadLocalEnv = (): void => {
  const envPath = resolveEnvPath();
  if (!existsSync(envPath)) {
    return;
  }
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const eq = line.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};