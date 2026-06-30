/**
 * CI migration runner — applies V001/V002 + pix supplemental DDL.
 * Requires DATABASE_URL. Exits non-zero on failure.
 */
import { Client, Pool } from 'pg';
import { runMigrations } from '../src/db/migration-runner';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://localhost:5432/regenera_core_test';

async function ensureDatabase(): Promise<void> {
  const parsed = new URL(DATABASE_URL);
  const dbName = parsed.pathname.replace(/^\//, '');
  parsed.pathname = '/postgres';
  const admin = new Client({ connectionString: parsed.toString() });
  await admin.connect();
  try {
    const exists = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
      console.log(`created database ${dbName}`);
    }
  } finally {
    await admin.end();
  }
}

async function main(): Promise<void> {
  await ensureDatabase();
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const results = await runMigrations(pool);
    console.log(JSON.stringify({ database: DATABASE_URL, results }, null, 2));
    const applied = results.filter((r) => r.applied).map((r) => r.version);
    const skipped = results.filter((r) => r.skipped).map((r) => r.version);
    console.log(`MIGRATION_SUMMARY applied=[${applied.join(',')}] skipped=[${skipped.join(',')}]`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('migration runner failed:', error);
  process.exit(1);
});