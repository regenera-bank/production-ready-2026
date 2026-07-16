import { Pool, PoolConfig } from 'pg';

let sharedPool: Pool | null = null;

export function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is required unless CORE_BANK_STORAGE=memory.',
    );
  }
  return url;
}

export function createPostgresPool(config?: Partial<PoolConfig>): Pool {
  const connectionString = resolveDatabaseUrl();
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    ...config,
  });
}

export function getPostgresPool(): Pool {
  if (!sharedPool) {
    sharedPool = createPostgresPool();
  }
  return sharedPool;
}

export async function closePostgresPool(): Promise<void> {
  if (sharedPool) {
    await sharedPool.end();
    sharedPool = null;
  }
}

export function resetPostgresPoolForTests(): void {
  sharedPool = null;
}