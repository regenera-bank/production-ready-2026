import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { IdempotencyRecord } from '../../idempotency/idempotency.entity';
import { IdempotencyRepository } from '../../idempotency/idempotency.repository';
import { POSTGRES_POOL } from '../../storage/storage.tokens';
import { PgQueryable } from '../postgres-queryable';
import { mapIdempotencyRow } from './postgres-row-mappers';

@Injectable()
export class PostgresIdempotencyRepository implements IdempotencyRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  private db(client?: PgQueryable): PgQueryable {
    return client ?? this.pool;
  }

  async findByKey(key: string, client?: PgQueryable): Promise<IdempotencyRecord | null> {
    const result = await this.db(client).query(
      `SELECT idempotency_key, payload_hash, state, response_reference, created_at, updated_at
       FROM core_banking.idempotency_records
       WHERE idempotency_key = $1`,
      [key],
    );
    if (result.rows.length === 0) return null;
    return mapIdempotencyRow(result.rows[0]);
  }

  async save(record: IdempotencyRecord, client?: PgQueryable): Promise<IdempotencyRecord> {
    const db = this.db(client);
    const result = await db.query(
      `INSERT INTO core_banking.idempotency_records (
         idempotency_key, payload_hash, state, response_reference, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (idempotency_key) DO UPDATE SET
         payload_hash = EXCLUDED.payload_hash,
         state = EXCLUDED.state,
         response_reference = EXCLUDED.response_reference,
         updated_at = EXCLUDED.updated_at
       RETURNING idempotency_key, payload_hash, state, response_reference, created_at, updated_at`,
      [
        record.idempotencyKey,
        record.payloadHash,
        record.state,
        record.responseReference,
        record.createdAt,
        record.updatedAt,
      ],
    );
    return mapIdempotencyRow(result.rows[0]);
  }
}