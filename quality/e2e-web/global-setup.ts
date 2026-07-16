import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const bffRoot = path.join(repoRoot, 'bff/web-bff');
const coreRoot = path.join(repoRoot, 'domains/core-bank');

const port = Number(process.env.E2E_BFF_PORT ?? 3210);
const webPort = Number(process.env.WEB_PORT ?? 5177);
const healthUrl = `http://localhost:${port}/v1/health`;

const waitForHealth = async (timeoutMs = 120_000): Promise<void> => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        const body = (await response.json()) as { status?: string };
        if (body.status === 'ok') {
          return;
        }
      }
    } catch {
      /* BFF ainda subindo */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`BFF não respondeu em ${healthUrl} dentro de ${timeoutMs}ms`);
};

const runCommand = (cwd: string, command: string, args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exit ${code ?? 'unknown'} em ${cwd}`));
    });
  });

export default async function globalSetup(): Promise<void> {
  if (process.env.E2E_SKIP_BFF_START === '1') {
    process.env.BFF_BASE_URL = process.env.BFF_BASE_URL ?? `http://localhost:${port}/v1`;
    return;
  }

  await runCommand(coreRoot, 'npm', ['run', 'build']);
  await runCommand(bffRoot, 'npm', ['run', 'build']);

  const env = {
    ...process.env,
    PORT: String(port),
    NODE_ENV: 'test',
    HOMOLOG_STORE_MEMORY: 'true',
    CORE_BANK_STORAGE: 'memory',
    KYC_PROVIDER: 'homolog',
    ALLOW_HOMOLOG_KYC: 'true',
    E2E_VISION_STUB: 'true',
    WEB_ORIGIN: process.env.WEB_ORIGIN ?? `http://localhost:${webPort}`,
    WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID ?? 'localhost',
  };

  const child: ChildProcess = spawn('node', ['dist/main.js'], {
    cwd: bffRoot,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (!child.pid) {
    throw new Error('Falha ao iniciar BFF para E2E');
  }

  process.env.E2E_BFF_PID = String(child.pid);
  process.env.BFF_BASE_URL = `http://localhost:${port}/v1/`;
  process.env.E2E_BFF_PORT = String(port);

  const logTail: string[] = [];
  child.stdout?.on('data', (chunk: Buffer) => {
    logTail.push(chunk.toString());
    if (logTail.length > 40) {
      logTail.shift();
    }
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    logTail.push(chunk.toString());
    if (logTail.length > 40) {
      logTail.shift();
    }
  });

  try {
    await waitForHealth();
  } catch (error) {
    child.kill('SIGTERM');
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}\n--- BFF log tail ---\n${logTail.join('')}`,
    );
  }
}