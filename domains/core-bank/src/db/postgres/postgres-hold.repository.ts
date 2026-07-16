import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { HoldRecord } from '../../holds/hold.entity';
import { HoldRepository } from '../../holds/hold.repository';
import { POSTGRES_POOL } from '../../storage/storage.tokens';
import { PgQueryable } from '../postgres-queryable';
import { mapHoldRow } from './postgres-row-mappers';

@Injectable()
export class PostgresHoldRepository implements HoldRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  private db(client?: PgQueryable): PgQueryable {
    return client ?? this.pool;
  }

  async save(hold: HoldRecord, client?: PgQueryable): Promise<HoldRecord> {
    const result = await this.db(client).query(
      `INSERT INTO core_banking.holds (
         id, ledger_account_id, amount_minor, currency, status, payment_id,
         expires_at, created_at, released_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         payment_id = EXCLUDED.payment_id,
         released_at = EXCLUDED.released_at
       RETURNING id, ledger_account_id, amount_minor, currency, status, payment_id,
                 expires_at, created_at, released_at`,
      [
        hold.id,
        hold.ledgerAccountId,
        hold.amount.toCentsString(),
        hold.amount.currency,
        hold.status,
        hold.paymentId,
        hold.expiresAt,
        hold.createdAt,
        hold.releasedAt,
      ],
    );
    return mapHoldRow(result.rows[0]);
  }

  async findById(id: string): Promise<HoldRecord | null> {
    const result = await this.pool.query(
      `SELECT id, ledger_account_id, amount_minor, currency, status, payment_id,
              expires_at, created_at, released_at
       FROM core_banking.holds WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) return null;
    return mapHoldRow(result.rows[0]);
  }

  async findActiveByAccount(ledgerAccountId: string): Promise<HoldRecord[]> {
    const result = await this.pool.query(
      `SELECT id, ledger_account_id, amount_minor, currency, status, payment_id,
              expires_at, created_at, released_at
       FROM core_banking.holds
       WHERE ledger_account_id = $1 AND status = 'ACTIVE'`,
      [ledgerAccountId],
    );
    return result.rows.map(mapHoldRow);
  }

  async findAllActive(): Promise<HoldRecord[]> {
    const result = await this.pool.query(
      `SELECT id, ledger_account_id, amount_minor, currency, status, payment_id,
              expires_at, created_at, released_at
       FROM core_banking.holds
       WHERE status = 'ACTIVE'`,
    );
    return result.rows.map(mapHoldRow);
  }
}