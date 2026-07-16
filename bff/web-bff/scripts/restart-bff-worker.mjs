#!/usr/bin/env node
/**
 * Worker isolado — mata e religa o BFF, verifica jornada ativa via API.
 * Invocado pelo run-journey-restart-persist.mjs (processo pai não mata o BFF).
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const statePath = process.argv[2];
const resultPath = process.argv[3];
if (!statePath || !resultPath) {
  process.exit(2);
}

const state = JSON.parse(readFileSync(statePath, 'utf8'));
const ROOT = state.root;
const BFF = state.bffBaseUrl;
const BFF_PORT = Number(state.bffPort ?? 3200);
const CORE_PORT = Number(state.corePort ?? 3100);
const DATABASE_URL = state.databaseUrl;
const logPath = state.logPath ?? null;
const logFd = logPath ? openSync(logPath, 'a') : null;

const log = (line) => {
  const msg = `[restart-worker ${new Date().toISOString()}] ${line}\n`;
  if (logFd != null) {
    try {
      require('node:fs').writeSync(logFd, msg);
    } catch {
      // ignore
    }
  }
};

const writeResult = (payload) => {
  writeFileSync(resultPath, `${JSON.stringify(payload, null, 2)}\n`);
};

const listListenerPids = () => {
  const portPids = spawnSync(
    'bash',
    ['-c', `lsof -ti tcp:${BFF_PORT} -sTCP:LISTEN 2>/dev/null`],
    { encoding: 'utf8' },
  );
  return (portPids.stdout ?? '')
    .split(/\s+/)
    .map((raw) => Number(raw))
    .filter((pid) => pid > 0 && pid !== process.pid);
};

const killBff = (signal = 'SIGTERM') => {
  const pidFile = process.env.BFF_PID_FILE;
  if (pidFile) {
    try {
      const pid = Number(readFileSync(pidFile, 'utf8').trim());
      if (pid > 0) {
        try {
          process.kill(pid, signal);
        } catch {
          // processo já encerrado
        }
      }
    } catch {
      // segue para fallback por porta
    }
  }
  for (const pid of listListenerPids()) {
    try {
      process.kill(pid, signal);
    } catch {
      // já morto
    }
  }
};

const waitPortFree = async (maxSec = 20) => {
  for (let i = 0; i < maxSec; i += 1) {
    if (listListenerPids().length === 0) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return listListenerPids().length === 0;
};

const captureListenerPid = () => {
  const pids = listListenerPids();
  const pid = pids[0];
  if (pid && process.env.BFF_PID_FILE) {
    writeFileSync(process.env.BFF_PID_FILE, `${pid}\n`);
  }
  return pid ?? null;
};

const startBffOnly = () => {
  const env = {
    ...process.env,
    DATABASE_URL,
    CORE_BANK_STORAGE: 'postgres',
    CHANNEL_PERSISTENCE: 'postgres',
    HOMOLOG_STORE_MEMORY: 'false',
    HOMOLOG_BASELINE_MODE: 'true',
    BASELINE_OPERATOR_TOKEN: process.env.BASELINE_OPERATOR_TOKEN ?? 'local-baseline-operator',
    CORE_API_BASE_URL: `http://localhost:${CORE_PORT}/v1`,
    NODE_ENV: 'development',
    PORT: String(BFF_PORT),
  };
  const bffRoot = join(ROOT, 'bff', 'web-bff');
  const distMain = join(bffRoot, 'dist', 'main.js');
  const stdio = logFd != null ? ['ignore', logFd, logFd] : 'ignore';

  if (existsSync(distMain)) {
    log(`subindo BFF via node dist/main.js (porta ${BFF_PORT})`);
    const bff = spawn(process.execPath, [distMain], {
      cwd: bffRoot,
      env,
      stdio,
      detached: true,
    });
    bff.unref();
    if (process.env.BFF_PID_FILE) {
      writeFileSync(process.env.BFF_PID_FILE, `${bff.pid}\n`);
    }
    return { mode: 'dist', pid: bff.pid };
  }

  log('dist/main.js ausente — fallback npm run start:dev (lento)');
  const bff = spawn('npm', ['run', 'start:dev'], {
    cwd: bffRoot,
    env,
    stdio,
    detached: true,
  });
  bff.unref();
  if (process.env.BFF_PID_FILE) {
    writeFileSync(process.env.BFF_PID_FILE, `${bff.pid}\n`);
  }
  return { mode: 'start:dev', pid: bff.pid };
};

const waitHealth = async (maxSec = 90) => {
  for (let i = 0; i < maxSec; i += 2) {
    try {
      const readyRes = await fetch(`${BFF}/health/ready`);
      const core = await fetch(`http://localhost:${CORE_PORT}/v1/health`);
      let channelPg = false;
      if (readyRes.ok) {
        const readyBody = await readyRes.json();
        channelPg = readyBody?.checks?.channelPersistence === true;
      }
      if (readyRes.ok && core.ok && channelPg) {
        captureListenerPid();
        return true;
      }
    } catch {
      // subindo
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
};

const fetchActive = async () => {
  const res = await fetch(`${BFF}/onboarding/journeys/active`, {
    headers: {
      Authorization: `Bearer ${state.accessToken}`,
      'content-type': 'application/json',
    },
  });
  const body = await res.json();
  const apiOk =
    res.ok && body?.found === true && body?.journey?.journeyId === state.journeyId;
  return { res, body, apiOk };
};

const main = async () => {
  log('início — kill BFF listener');
  killBff('SIGTERM');
  let portFree = await waitPortFree(12);
  if (!portFree) {
    log('porta ainda ocupada — SIGKILL nos listeners :3200');
    killBff('SIGKILL');
    portFree = await waitPortFree(8);
  }
  if (!portFree) {
    writeResult({
      ready: false,
      apiOk: false,
      error: `porta ${BFF_PORT} ainda ocupada após kill`,
      at: new Date().toISOString(),
    });
    process.exit(1);
  }

  await new Promise((r) => setTimeout(r, 1500));
  const launch = startBffOnly();
  log(`BFF lançado mode=${launch.mode} pid=${launch.pid}`);

  const ready = await waitHealth(90);
  log(`health ready=${ready}`);
  if (!ready) {
    writeResult({
      ready: false,
      apiOk: false,
      error: 'BFF não ficou ready em 90s após restart',
      launch,
      at: new Date().toISOString(),
    });
    process.exit(1);
  }

  await new Promise((r) => setTimeout(r, 2000));

  let last = { res: { ok: false, status: 0 }, body: null, apiOk: false };
  for (let attempt = 0; attempt < 10; attempt += 1) {
    last = await fetchActive();
    log(`tentativa jornada ativa ${attempt + 1}: apiOk=${last.apiOk} status=${last.res.status}`);
    if (last.apiOk) {
      break;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  writeResult({
    ready,
    apiOk: last.apiOk,
    body: last.body,
    status: last.res.status,
    launch,
    listenerPid: captureListenerPid(),
    at: new Date().toISOString(),
  });
  process.exit(last.apiOk && ready ? 0 : 1);
};

main().catch((error) => {
  log(`erro fatal: ${error instanceof Error ? error.message : String(error)}`);
  writeResult({
    ready: false,
    apiOk: false,
    error: error instanceof Error ? error.message : String(error),
    at: new Date().toISOString(),
  });
  process.exit(1);
});