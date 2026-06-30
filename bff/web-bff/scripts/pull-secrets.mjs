#!/usr/bin/env node
/**
 * Puxa segredos do GCP Secret Manager para bff/web-bff/.env (dev local).
 * Nunca imprime valores — só nomes e status.
 *
 * Uso:
 *   node scripts/pull-secrets.mjs
 *   node scripts/pull-secrets.mjs --dry-run
 *   node scripts/pull-secrets.mjs --list
 *   GCP_PROJECT_ID=outro-projeto node scripts/pull-secrets.mjs
 */
import { execSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BFF_ROOT = join(__dirname, '..');
const ENV_PATH = join(BFF_ROOT, '.env');
const EXAMPLE_PATH = join(BFF_ROOT, '.env.example');

const PROJECT_PROD = 'regenera-bank-501015';
const PROJECT_FIREBASE = 'project-93b8df04-72ab-4e44-8a6';

/** Variáveis locais que pull-secrets nunca sobrescreve */
const LOCAL_PRESERVE_KEYS = [
  'KYC_PROVIDER',
  'GEMINI_USE_VERTEX',
  'GEMINI_GCP_PROJECT_ID',
  'GEMINI_VERTEX_LOCATION',
  'GEMINI_API_KEY_FALLBACK',
  'VISION_USE_ADC',
  'GOOGLE_VISION_PROJECT_ID',
  'PORT',
  'WEB_ORIGIN',
  'WEBAUTHN_RP_ID',
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
];

/** Secret Manager name candidates → variável no .env local */
const SECRET_MAPPINGS = [
  { envKey: 'PROMETEO_API_KEY', smNames: ['PROMETEO_API_KEY', 'prometeo-api-key'] },
  { envKey: 'GEMINI_API_KEY', smNames: ['GEMINI_API_KEY', 'gemini-api-key'] },
  { envKey: 'DATABASE_URL', smNames: ['DATABASE_URL', 'neon-database-url'] },
  {
    envKey: 'JWT_SESSION_SECRET',
    smNames: ['JWT_SESSION_SECRET', 'JWT_NEURAL_SECRET', 'jwt-neural-secret'],
  },
  {
    envKey: 'GOOGLE_VISION_API_KEY',
    smNames: ['GOOGLE_VISION_API_KEY', 'google-vision-api-key'],
  },
  { envKey: 'DATAVALID_API_KEY', smNames: ['DATAVALID_API_KEY', 'datavalid-api-key'] },
  { envKey: 'DATAVALID_API_URL', smNames: ['DATAVALID_API_URL', 'datavalid-api-url'] },
  { envKey: 'PEP_API_KEY', smNames: ['PEP_API_KEY', 'pep-api-key'] },
  { envKey: 'PEP_API_URL', smNames: ['PEP_API_URL', 'pep-api-url'] },
  { envKey: 'TELEGRAM_BOT_TOKEN', smNames: ['TELEGRAM_BOT_TOKEN', 'telegram-bot-token'] },
  { envKey: 'TELEGRAM_CHAT_ID', smNames: ['TELEGRAM_CHAT_ID', 'telegram-chat-id'] },
];

const KYC_CADASTRAL_REQUIRED = ['PROMETEO_API_KEY'];
const KYC_DOCUMENT_REQUIRED = ['GOOGLE_VISION_API_KEY'];

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const listOnly = args.has('--list');

const projectCandidates = () => {
  const explicit =
    process.env.GCP_PROJECT_ID?.trim() ||
    process.env.GOOGLE_CLOUD_PROJECT?.trim();
  if (explicit) {
    return [explicit];
  }
  return [PROJECT_PROD, PROJECT_FIREBASE];
};

let project = projectCandidates()[0];

const hasGcloud = () => {
  const probe = spawnSync('gcloud', ['--version'], { encoding: 'utf8' });
  return probe.status === 0;
};

const listSecretsForProject = (projectId) => {
  const out = execSync(
    `gcloud secrets list --project="${projectId}" --format="value(name)"`,
    { encoding: 'utf8' },
  );
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
};

const resolveProject = () => {
  const candidates = projectCandidates();
  const errors = [];
  for (const candidate of candidates) {
    try {
      listSecretsForProject(candidate);
      if (candidate !== candidates[0]) {
        console.log(
          `Projeto SM: ${candidate} (fallback — ${candidates[0]} sem permissão)`,
        );
      }
      return candidate;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${candidate}: ${msg.split('\n')[0]}`);
    }
  }
  throw new Error(
    `Nenhum projeto SM acessível.\n${errors.map((e) => `  · ${e}`).join('\n')}\n` +
      `  finance@ → use GCP_PROJECT_ID=${PROJECT_PROD} após bootstrap-secrets\n` +
      `  Firebase legado → gcloud auth login inovaagora5@gmail.com && GCP_PROJECT_ID=${PROJECT_FIREBASE} npm run pull-secrets`,
  );
};

const listSecrets = () => listSecretsForProject(project);

const fetchSecret = (secretName) => {
  try {
    const value = execSync(
      `gcloud secrets versions access latest --secret="${secretName}" --project="${project}"`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return value.replace(/\r?\n$/, '');
  } catch {
    return null;
  }
};

const formatEnvValue = (value) => {
  if (/[#\s"'\\]/.test(value)) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
};

const parseEnvKeys = (content) => {
  const keys = new Set();
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq > 0) keys.add(line.slice(0, eq).trim());
  }
  return keys;
};

const extractEnvValues = (content, keys) => {
  const values = {};
  for (const key of keys) {
    const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
    if (!match) continue;
    let value = match[1].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
};

const applyUpdates = (content, updates) => {
  const applied = new Set();
  const lines = content.split('\n');
  const next = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) return line;
    const key = trimmed.slice(0, eq).trim();
    if (updates[key] === undefined) return line;
    applied.add(key);
    return `${key}=${formatEnvValue(updates[key])}`;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (applied.has(key) || !value) continue;
    next.push(`${key}=${formatEnvValue(value)}`);
  }

  return next.join('\n').replace(/\n?$/, '\n');
};

const readEnvTemplate = () => {
  if (existsSync(ENV_PATH)) {
    return readFileSync(ENV_PATH, 'utf8');
  }
  if (existsSync(EXAMPLE_PATH)) {
    return readFileSync(EXAMPLE_PATH, 'utf8');
  }
  throw new Error('Nem .env nem .env.example encontrados em bff/web-bff/');
};

const envValuePresent = (key, updates, existingKeys) => {
  if (updates[key]?.trim()) return true;
  if (!existingKeys.has(key)) return false;
  const content = readEnvTemplate();
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  const current = match?.[1]?.trim().replace(/^["']|["']$/g, '');
  return Boolean(current);
};

const readKycProvider = () => {
  const content = readEnvTemplate();
  const match = content.match(/^KYC_PROVIDER=(.*)$/m);
  const raw = match?.[1]?.trim().replace(/^["']|["']$/g, '') ?? 'firebase';
  return raw.toLowerCase();
};

const reportKycReadiness = (updates, existingKeys) => {
  const kycProvider = readKycProvider();
  const homologKyc = kycProvider === 'firebase' || kycProvider === 'homolog';
  const missingCadastral = homologKyc
    ? []
    : KYC_CADASTRAL_REQUIRED.filter(
        (key) => !envValuePresent(key, updates, existingKeys),
      );
  const missingDocument = KYC_DOCUMENT_REQUIRED.filter(
    (key) => !envValuePresent(key, updates, existingKeys),
  );

  console.log('');
  if (homologKyc) {
    console.log(
      `✓ KYC cadastral: modo homolog (${kycProvider}) — Prometeo não exigido`,
    );
  } else if (missingCadastral.length === 0) {
    console.log(
      '✓ KYC cadastral: PROMETEO ok (PEP/DataValid usam Prometeo se dedicados ausentes)',
    );
  } else {
    console.log('⚠ KYC cadastral incompleto — faltam no .env:');
    for (const key of missingCadastral) console.log(`  - ${key}`);
  }

  if (missingDocument.length === 0) {
    console.log('✓ KYC documento: GOOGLE_VISION_API_KEY presente');
  } else {
    console.log('⚠ Etapa documento (OCR) — falta no .env:');
    for (const key of missingDocument) console.log(`  - ${key}`);
    console.log('  Dica: use a Firebase/GCP Web API Key com Vision API habilitada.');
  }

  if (missingCadastral.length > 0) {
    console.log('');
    console.log('Rode: npm run bootstrap-secrets && npm run pull-secrets');
  }
};

const main = () => {
  if (!hasGcloud()) {
    console.error('✗ gcloud CLI não encontrado. Instale: https://cloud.google.com/sdk/docs/install');
    process.exit(1);
  }

  const account = spawnSync('gcloud', ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'], {
    encoding: 'utf8',
  });
  if (!account.stdout?.trim()) {
    console.error('✗ gcloud sem conta ativa. Rode: gcloud auth login');
    process.exit(1);
  }
  console.log(`Conta: ${account.stdout.trim()}`);

  try {
    project = resolveProject();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${msg}`);
    process.exit(1);
  }

  console.log(`Secret Manager → bff/web-bff/.env (projeto: ${project})`);

  let available = [];
  try {
    available = listSecrets();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`✗ Falha ao listar secrets: ${msg}`);
    process.exit(1);
  }

  if (listOnly) {
    console.log(`\nSecrets no projeto (${available.length}):`);
    for (const name of available.sort()) {
      console.log(`  - ${name}`);
    }
    process.exit(0);
  }

  const availableSet = new Set(available);
  const updates = {};
  const pulled = [];
  const skipped = [];

  const kycProvider = readKycProvider();
  const homologKyc = kycProvider === 'firebase' || kycProvider === 'homolog';

  for (const mapping of SECRET_MAPPINGS) {
    if (homologKyc && mapping.envKey === 'PROMETEO_API_KEY') {
      skipped.push(`${mapping.envKey} (KYC_PROVIDER=${kycProvider})`);
      continue;
    }
    const candidate = mapping.smNames.find((name) => availableSet.has(name));
    if (!candidate) {
      skipped.push(mapping.envKey);
      continue;
    }
    const value = fetchSecret(candidate);
    if (!value?.trim()) {
      skipped.push(`${mapping.envKey} (${candidate} vazio/inacessível)`);
      continue;
    }
    updates[mapping.envKey] = value.trim();
    pulled.push(`${mapping.envKey} ← ${candidate}`);
  }

  console.log('');
  if (pulled.length > 0) {
    console.log(`Puxados (${pulled.length}):`);
    for (const line of pulled) console.log(`  ✓ ${line}`);
  } else {
    console.log('Nenhum secret novo puxado (verifique nomes com --list).');
  }

  if (skipped.length > 0) {
    console.log('');
    console.log('Não encontrados ou sem acesso no SM:');
    for (const key of skipped) console.log(`  · ${key}`);
  }

  if (Object.keys(updates).length === 0) {
    console.log('\nNada para gravar no .env.');
    reportKycReadiness({}, parseEnvKeys(readEnvTemplate()));
    process.exit(0);
  }

  const template = readEnvTemplate();
  const existingKeys = parseEnvKeys(template);
  const preserved = extractEnvValues(template, LOCAL_PRESERVE_KEYS);
  const merged = applyUpdates(template, { ...updates, ...preserved });

  if (dryRun) {
    console.log('\n--dry-run: .env não foi alterado.');
    reportKycReadiness(updates, existingKeys);
    process.exit(0);
  }

  if (existsSync(ENV_PATH)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = `${ENV_PATH}.backup.${stamp}`;
    copyFileSync(ENV_PATH, backup);
    console.log(`\nBackup: ${backup}`);
  }

  writeFileSync(ENV_PATH, merged, 'utf8');
  console.log(`✓ Gravado: ${ENV_PATH}`);
  console.log('Reinicie o canal: npm run dev:canal-web (na raiz do monorepo)');

  reportKycReadiness(updates, existingKeys);
};

main();