import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

const MIGRATIONS_DIR = join(__dirname, '../../db/migrations');

const MIGRATION_FILES = [
  { version: 'V001', file: 'V001__channel_experience_foundation.sql' },
  { version: 'V002', file: 'V002__onboarding_profiles.sql' },
  { version: 'V003', file: 'V003__projector_outbox_and_vault.sql' },
  { version: 'V004', file: 'V004__channel_ancillary_and_customer.sql' },
] as const;

export interface MigrationResult {
  version: string;
  applied: boolean;
  skipped: boolean;
}

export async function ensureChannelMigrationTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS channel_experience;
    CREATE TABLE IF NOT EXISTS channel_experience.schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function isChannelMigrationApplied(
  pool: Pool,
  version: string,
): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM channel_experience.schema_migrations WHERE version = $1
     ) AS exists`,
    [version],
  );
  return result.rows[0]?.exists ?? false;
}

export async function applyChannelMigrationFile(
  pool: Pool,
  version: string,
  fileName: string,
): Promise<void> {
  const sql = readFileSync(join(MIGRATIONS_DIR, fileName), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      `INSERT INTO channel_experience.schema_migrations (version) VALUES ($1)`,
      [version],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function runChannelMigrations(pool: Pool): Promise<MigrationResult[]> {
  await ensureChannelMigrationTable(pool);
  const results: MigrationResult[] = [];
  for (const entry of MIGRATION_FILES) {
    const applied = await isChannelMigrationApplied(pool, entry.version);
    if (applied) {
      results.push({ version: entry.version, applied: false, skipped: true });
      continue;
    }
    await applyChannelMigrationFile(pool, entry.version, entry.file);
    results.push({ version: entry.version, applied: true, skipped: false });
  }
  return results;
}