export default async function globalTeardown(): Promise<void> {
  const pid = Number(process.env.E2E_BFF_PID ?? 0);
  if (!pid) {
    return;
  }
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    /* processo já encerrou */
  }
}