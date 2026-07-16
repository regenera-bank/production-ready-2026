import { execSync } from 'node:child_process';

const port = Number(process.env.PORT ?? 3200);

function listListenerPids(targetPort) {
  try {
    const out = execSync(`lsof -nP -iTCP:${targetPort} -sTCP:LISTEN -t`, {
      encoding: 'utf8',
    }).trim();
    return out ? out.split('\n').map((pid) => pid.trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

const pids = listListenerPids(port);
if (pids.length === 0) {
  console.log(`porta ${port} livre`);
  process.exit(0);
}

for (const pid of pids) {
  const id = Number(pid);
  if (!id || id === process.pid) continue;
  try {
    process.kill(id, 'SIGTERM');
    console.log(`encerrado listener PID ${id} na porta ${port}`);
  } catch (error) {
    console.warn(`falha ao encerrar PID ${id}:`, error.message);
  }
}