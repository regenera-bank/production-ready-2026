import { StorageMode } from './storage.tokens';

export function resolveStorageMode(): StorageMode {
  const mode = (process.env.CORE_BANK_STORAGE ?? 'postgres').toLowerCase();

  if (mode !== 'postgres' && mode !== 'memory') {
    throw new Error(
      `Invalid CORE_BANK_STORAGE="${process.env.CORE_BANK_STORAGE}". Expected "postgres" or "memory".`,
    );
  }

  if (mode === 'postgres' && !process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is required when CORE_BANK_STORAGE=postgres. No silent fallback to in-memory.',
    );
  }

  return mode;
}