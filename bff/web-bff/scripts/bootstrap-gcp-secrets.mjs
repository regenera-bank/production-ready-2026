#!/usr/bin/env node
/**
 * Sobe secrets do arquivo local .env.secrets.local para o GCP Secret Manager.
 * O arquivo NÃO vai para o git — só máquina de dev.
 *
 * Uso:
 *   1. cp .env.secrets.local.example .env.secrets.local
 *   2. Preencha os valores
 *   3. npm run bootstrap-secrets
 *   4. npm run pull-secrets
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BFF_ROOT = join(__dirname, '..');
const LOCAL_SECRETS = join(BFF_ROOT, '.env.secrets.local');
const DEFAULT_PROJECT = 'regenera-bank-501015';
const LEGACY_FIREBASE_PROJECT = 'project-93b8df04-72ab-4e44-8a6';

const SECRET_KEYS = [
  'PROMETEO_API_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_VISION_API_KEY',
  'DATABASE_URL',
  'JWT_NEURAL_SECRET',
  'JWT_SESSION_SECRET',
  'PEP_API_URL',
  'PEP_API_KEY',
  'DATAVALID_API_URL',
  'DATAVALID_API_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
];

const project =
  process.env.GCP_PROJECT_ID?.trim() ||
  process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
  DEFAULT_PROJECT;

const parseLocalSecrets = (content) => {
  const map = {};
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) map[key] = value;
  }
  return map;
};

const secretExists = (name) => {
  const probe = spawnSync(
    'gcloud',
    ['secrets', 'describe', name, `--project=${project}`],
    { encoding: 'utf8' },
  );
  return probe.status === 0;
};

const upsertSecret = (name, value) => {
  if (secretExists(name)) {
    execSync(
      `gcloud secrets versions add ${name} --data-file=- --project=${project}`,
      { input: value, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    );
    return 'updated';
  }
  execSync(
    `gcloud secrets create ${name} --data-file=- --project=${project}`,
    { input: value, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  );
  return 'created';
};

const main = () => {
  if (!existsSync(LOCAL_SECRETS)) {
    console.error(`✗ Arquivo ausente: ${LOCAL_SECRETS}`);
    console.error('  cp .env.secrets.local.example .env.secrets.local');
    process.exit(1);
  }

  const map = parseLocalSecrets(readFileSync(LOCAL_SECRETS, 'utf8'));

  if (map.JWT_NEURAL_SECRET && !map.JWT_SESSION_SECRET) {
    map.JWT_SESSION_SECRET = map.JWT_NEURAL_SECRET;
  }
  if (map.FIREBASE_API_KEY && !map.GOOGLE_VISION_API_KEY) {
    map.GOOGLE_VISION_API_KEY = map.FIREBASE_API_KEY;
  }

  const toPush = SECRET_KEYS.filter((key) => map[key]?.trim());
  if (toPush.length === 0) {
    console.error('✗ Nenhum valor preenchido em .env.secrets.local');
    process.exit(1);
  }

  console.log(`Subindo ${toPush.length} secrets → GCP (${project})`);
  if (project === DEFAULT_PROJECT) {
    console.log(
      `  (legado Firebase SM: GCP_PROJECT_ID=${LEGACY_FIREBASE_PROJECT})`,
    );
  }
  for (const key of toPush) {
    try {
      const action = upsertSecret(key, map[key].trim());
      console.log(`  ✓ ${key} (${action})`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ ${key}: ${msg}`);
    }
  }

  console.log('\nPróximo passo: npm run pull-secrets');
};

main();