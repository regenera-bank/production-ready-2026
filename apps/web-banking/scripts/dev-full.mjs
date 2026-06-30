import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, '..');
const repoRoot = path.join(webRoot, '../..');
const bffRoot = path.join(repoRoot, 'bff/web-bff');
const coreBankRoot = path.join(repoRoot, 'domains/core-bank');
const webPort = Number(process.env.VITE_PORT ?? 5176);
const bffPort = Number(process.env.PORT ?? 3200);
const apiBase = `http://localhost:${bffPort}/v1/health`;
const webUrl = `http://localhost:${webPort}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runStep = (label, command, args, cwd) => {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    console.error(`✗ Falhou: ${label}`);
    process.exit(result.status ?? 1);
  }
};

const probeBff = async () => {
  try {
    const res = await fetch(apiBase);
    if (!res.ok) return false;
    const body = await res.json();
    return body.status === 'ok' && body.layer === 'web-bff';
  } catch {
    return false;
  }
};

const waitForBffDown = async (attempts = 15) => {
  for (let i = 0; i < attempts; i += 1) {
    if (!(await probeBff())) return true;
    await sleep(400);
  }
  return false;
};

const waitForBffUp = async (attempts = 120) => {
  for (let i = 0; i < attempts; i += 1) {
    if (await probeBff()) return true;
    await sleep(1000);
  }
  return false;
};

console.log('Regenera dev:canal-web — BFF + Web Banking\n');

runStep('Dependências do web-banking', 'npm', ['install'], webRoot);
runStep('Dependências do BFF', 'npm', ['install'], bffRoot);
runStep('Liberar portas de dev', 'node', ['scripts/free-dev-ports.mjs'], repoRoot);

if (!(await waitForBffDown())) {
  console.error('BFF ainda responde após liberar portas. Encerre processos manualmente.');
  process.exit(1);
}

runStep('Build core-bank', 'npm', ['run', 'build'], coreBankRoot);
runStep('Garantir dist do BFF', 'node', ['scripts/ensure-dist.mjs'], bffRoot);
runStep('Verificar core-bank', 'node', ['scripts/verify-core-bank.mjs'], bffRoot);

console.log('\n▶ Iniciando BFF (nest --watch)');
const bff = spawn('npx', ['nest', 'start', '--watch'], {
  cwd: bffRoot,
  stdio: 'inherit',
  env: { ...process.env, PORT: String(bffPort) },
});

bff.on('error', (err) => {
  console.error('Falha ao iniciar BFF:', err.message);
  process.exit(1);
});

console.log(`Aguardando ${apiBase} ...`);
const ready = await waitForBffUp();
if (!ready) {
  console.error('BFF não respondeu a tempo. Verifique bff/web-bff/.env');
  bff.kill('SIGTERM');
  process.exit(1);
}

console.log(`✓ BFF online — iniciando Vite em ${webUrl}\n`);
const vite = spawn('npm', ['run', 'dev'], {
  cwd: webRoot,
  stdio: 'inherit',
  env: { ...process.env, VITE_PORT: String(webPort) },
});

const shutdown = () => {
  vite.kill('SIGTERM');
  bff.kill('SIGTERM');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

vite.on('error', (err) => {
  console.error('Falha ao iniciar Vite:', err.message);
  bff.kill('SIGTERM');
  process.exit(1);
});

vite.on('exit', (code) => {
  bff.kill('SIGTERM');
  process.exit(code ?? 0);
});

bff.on('exit', (code, signal) => {
  if (signal !== 'SIGTERM' && code !== 0 && code !== null) {
    console.error(`BFF encerrou com código ${code}`);
    vite.kill('SIGTERM');
    process.exit(code ?? 1);
  }
});