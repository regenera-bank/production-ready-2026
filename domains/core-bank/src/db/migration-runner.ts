import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

const MIGRATIONS_DIR = join(__dirname, '../../db/migrations');

const MIGRATION_FILES = [
  { version: 'V001', file: 'V001__core_banking_foundation.sql' },
  { version: 'V002', file: 'V002__operational_views.sql' },
] as const;

const PIX_SUPPLEMENTAL_DDL = `
CREATE TABLE IF NOT EXISTS core_banking.pix_payments (
  id UUID PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES core_banking.payments (id),
  end_to_end_id TEXT NOT NULL,
  receiver_key_hmac TEXT NOT NULL,
  receiver_masked TEXT NOT NULL,
  receiver_key_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pix_payments_end_to_end_unique UNIQUE (end_to_end_id)
);

CREATE INDEX IF NOT EXISTS idx_pix_payments_end_to_end
  ON core_banking.pix_payments (end_to_end_id);
`;

export interface MigrationResult {
  version: string;
  applied: boolean;
  skipped: boolean;
}

export async function ensureMigrationTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS core_banking;

    CREATE TABLE IF NOT EXISTS core_banking.schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function isMigrationApplied(
  pool: Pool,
  version: string,
): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM core_banking.schema_migrations WHERE version = $1
     ) AS exists`,
    [version],
  );
  return result.rows[0]?.exists ?? false;
}

export async function applyMigrationFile(
  pool: Pool,
  version: string,
  filename: string,
): Promise<MigrationResult> {
  await ensureMigrationTable(pool);

  if (await isMigrationApplied(pool, version)) {
    return { version, applied: false, skipped: true };
  }

  const sql = readFileSync(join(MIGRATIONS_DIR, filename), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      `INSERT INTO core_banking.schema_migrations (version) VALUES ($1)`,
      [version],
    );
    await client.query('COMMIT');
    return { version, applied: true, skipped: false };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function ensurePixSchema(pool: Pool): Promise<void> {
  await pool.query(PIX_SUPPLEMENTAL_DDL);
}

export async function runMigrations(pool: Pool): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  for (const migration of MIGRATION_FILES) {
    results.push(
      await applyMigrationFile(pool, migration.version, migration.file),
    );
  }

  await ensurePixSchema(pool);
  return results;
}

export async function resetCoreBankingSchema(pool: Pool): Promise<void> {
  await pool.query('DROP SCHEMA IF EXISTS core_banking CASCADE');
  await ensureMigrationTable(pool);
}