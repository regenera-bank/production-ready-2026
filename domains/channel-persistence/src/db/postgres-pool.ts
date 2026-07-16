import { Pool, PoolConfig } from 'pg';

let sharedPool: Pool | null = null;

export function resolveChannelDatabaseUrl(): string {
  const url =
    process.env.CHANNEL_DATABASE_URL ??
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'CHANNEL_DATABASE_URL ou DATABASE_URL obrigatório quando CHANNEL_PERSISTENCE=postgres',
    );
  }
  return url;
}

export function createChannelPostgresPool(config?: Partial<PoolConfig>): Pool {
  return new Pool({
    connectionString: resolveChannelDatabaseUrl(),
    max: 10,
    idleTimeoutMillis: 30_000,
    ...config,
  });
}

export function getChannelPostgresPool(): Pool {
  if (!sharedPool) {
    sharedPool = createChannelPostgresPool();
  }
  return sharedPool;
}

export async function closeChannelPostgresPool(): Promise<void> {
  if (sharedPool) {
    await sharedPool.end();
    sharedPool = null;
  }
}