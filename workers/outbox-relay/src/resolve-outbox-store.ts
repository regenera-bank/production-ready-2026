import type { Pool } from 'pg';
import { InMemoryOutboxStore } from './in-memory-outbox-store';
import { PostgresOutboxStore } from './postgres-outbox-store';
import { getPostgresPool } from './postgres-pool';
import type { OutboxStore } from './outbox-store';

export interface ResolvedOutboxStore {
  store: OutboxStore;
  pool?: Pool;
}

/** Resolve store: memory apenas com CORE_BANK_STORAGE=memory; caso contrário exige DATABASE_URL */
export function resolveOutboxStore(): ResolvedOutboxStore {
  const storageMode = (process.env.CORE_BANK_STORAGE ?? '').toLowerCase();

  if (storageMode === 'memory') {
    return { store: new InMemoryOutboxStore() };
  }

  if (process.env.DATABASE_URL) {
    const pool = getPostgresPool();
    return { store: new PostgresOutboxStore(pool), pool };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL is required in production. No silent fallback to in-memory.',
    );
  }

  throw new Error(
    'DATABASE_URL is required unless CORE_BANK_STORAGE=memory.',
  );
}