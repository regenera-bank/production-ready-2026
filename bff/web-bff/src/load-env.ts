import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const resolveEnvPath = (): string => {
  const override = process.env.ENV_FILE?.trim();
  if (override) {
    return resolve(override);
  }
  return resolve(__dirname, '..', '.env');
};

const parseEnvFile = (
  envPath: string,
  override: boolean,
  protectedKeys: ReadonlySet<string>,
): void => {
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
    // Variáveis definidas explicitamente no ambiente do processo (operador,
    // CI, gates E2E) SEMPRE vencem arquivos .env/.env.local. Sem isso, um
    // .env.local de desenvolvedor sobrescreveria silenciosamente a
    // configuração dos gates §48 — reprovação automática mascarada.
    if (protectedKeys.has(key)) {
      continue;
    }
    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

/**
 * Carrega .env e depois .env.local (local sobrescreve o arquivo base).
 * Precedência final: process.env explícito > .env.local > .env (ou ENV_FILE).
 */
export const loadLocalEnv = (): void => {
  const baseDir = resolve(__dirname, '..');
  const override = process.env.ENV_FILE?.trim();
  const protectedKeys: ReadonlySet<string> = new Set(Object.keys(process.env));
  parseEnvFile(
    override ? resolve(override) : resolve(baseDir, '.env'),
    false,
    protectedKeys,
  );
  parseEnvFile(resolve(baseDir, '.env.local'), true, protectedKeys);
};