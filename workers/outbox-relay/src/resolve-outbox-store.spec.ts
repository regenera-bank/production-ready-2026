import { InMemoryOutboxStore } from './in-memory-outbox-store';
import { PostgresOutboxStore } from './postgres-outbox-store';
import { resolveOutboxStore, outboxStoreKind } from './resolve-outbox-store';

const ORIGINAL_ENV = { ...process.env };

function restoreEnv(): void {
  process.env = { ...ORIGINAL_ENV };
}

describe('resolveOutboxStore', () => {
  afterEach(() => {
    restoreEnv();
  });

  it('uses InMemoryOutboxStore only when CORE_BANK_STORAGE=memory', () => {
    process.env.CORE_BANK_STORAGE = 'memory';
    delete process.env.DATABASE_URL;

    const { store } = resolveOutboxStore();

    expect(store).toBeInstanceOf(InMemoryOutboxStore);
    expect(outboxStoreKind(store)).toBe('memory');
  });

  it('uses PostgresOutboxStore when DATABASE_URL is set (production default)', () => {
    delete process.env.CORE_BANK_STORAGE;
    process.env.DATABASE_URL = 'postgresql://localhost:5432/regenera_core_test';
    process.env.NODE_ENV = 'production';

    const { store, pool } = resolveOutboxStore();

    expect(store).toBeInstanceOf(PostgresOutboxStore);
    expect(pool).toBeDefined();
    expect(outboxStoreKind(store)).toBe('postgres');
  });

  it('refuses production without DATABASE_URL — no silent in-memory fallback', () => {
    delete process.env.CORE_BANK_STORAGE;
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'production';

    expect(() => resolveOutboxStore()).toThrow(/DATABASE_URL is required in production/);
  });

  it('refuses non-memory mode without DATABASE_URL in non-production', () => {
    delete process.env.CORE_BANK_STORAGE;
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'test';

    expect(() => resolveOutboxStore()).toThrow(/DATABASE_URL is required unless CORE_BANK_STORAGE=memory/);
  });
});