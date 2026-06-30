import { execSync } from 'node:child_process';

const ports = [
  Number(process.env.PORT ?? 3200),
  Number(process.env.VITE_PORT ?? 5176),
  5177,
  5178,
  5179,
  5180,
  5181,
  5182,
];

function listenerPids(targetPort) {
  try {
    const out = execSync(`lsof -nP -iTCP:${targetPort} -sTCP:LISTEN -t`, {
      encoding: 'utf8',
    }).trim();
    return out ? out.split('\n').map((pid) => Number(pid.trim())).filter(Boolean) : [];
  } catch {
    return [];
  }
}

let freed = 0;
for (const port of [...new Set(ports)]) {
  for (const pid of listenerPids(port)) {
    if (!pid || pid === process.pid) continue;
    try {
      process.kill(pid, 'SIGTERM');
      console.log(`porta ${port}: encerrado PID ${pid}`);
      freed += 1;
    } catch (error) {
      console.warn(`porta ${port}: falha ao encerrar PID ${pid}`, error.message);
    }
  }
}

if (freed === 0) {
  console.log('portas de dev livres (3200, 5176–5182)');
}