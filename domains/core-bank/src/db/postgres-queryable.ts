import { Pool, PoolClient, QueryResultRow } from 'pg';

export type PgQueryable = Pool | PoolClient;

export async function pgQuery<T extends QueryResultRow = QueryResultRow>(
  db: PgQueryable,
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await db.query<T>(text, params);
  return result.rows;
}

export async function pgQueryOne<T extends QueryResultRow = QueryResultRow>(
  db: PgQueryable,
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await pgQuery<T>(db, text, params);
  return rows[0] ?? null;
}