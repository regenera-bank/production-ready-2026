import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PaymentRecord } from '../../payments/payment.entity';
import { PaymentRepository } from '../../payments/payment.repository';
import { POSTGRES_POOL } from '../../storage/storage.tokens';
import { PgQueryable } from '../postgres-queryable';
import { mapPaymentRow } from './postgres-row-mappers';

@Injectable()
export class PostgresPaymentRepository implements PaymentRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  private db(client?: PgQueryable): PgQueryable {
    return client ?? this.pool;
  }

  async save(payment: PaymentRecord, client?: PgQueryable): Promise<PaymentRecord> {
    const db = this.db(client);
    const result = await db.query(
      `INSERT INTO core_banking.payments (
         id, status, debtor_account_id, creditor_account_id, amount_minor, currency,
         idempotency_key, correlation_id, journal_entry_id, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         journal_entry_id = EXCLUDED.journal_entry_id,
         updated_at = EXCLUDED.updated_at
       RETURNING id, status, debtor_account_id, creditor_account_id, amount_minor, currency,
                 idempotency_key, correlation_id, journal_entry_id, created_at, updated_at`,
      [
        payment.id,
        payment.status,
        payment.debtorAccountId,
        payment.creditorAccountId,
        payment.amount.toCentsString(),
        payment.amount.currency,
        payment.idempotencyKey,
        payment.correlationId,
        payment.journalEntryId,
        payment.createdAt,
        payment.updatedAt,
      ],
    );

    const holdId = await this.resolveHoldId(payment.id, db);
    return mapPaymentRow(result.rows[0], holdId);
  }

  async findById(id: string, client?: PgQueryable): Promise<PaymentRecord | null> {
    const db = this.db(client);
    const result = await db.query(
      `SELECT id, status, debtor_account_id, creditor_account_id, amount_minor, currency,
              idempotency_key, correlation_id, journal_entry_id, created_at, updated_at
       FROM core_banking.payments WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) return null;
    const holdId = await this.resolveHoldId(id, db);
    return mapPaymentRow(result.rows[0], holdId);
  }

  async findByIdempotencyKey(key: string): Promise<PaymentRecord | null> {
    const result = await this.pool.query(
      `SELECT id, status, debtor_account_id, creditor_account_id, amount_minor, currency,
              idempotency_key, correlation_id, journal_entry_id, created_at, updated_at
       FROM core_banking.payments WHERE idempotency_key = $1`,
      [key],
    );
    if (result.rows.length === 0) return null;
    const holdId = await this.resolveHoldId(result.rows[0].id);
    return mapPaymentRow(result.rows[0], holdId);
  }

  private async resolveHoldId(
    paymentId: string,
    db: PgQueryable = this.pool,
  ): Promise<string | null> {
    const result = await db.query<{ id: string }>(
      `SELECT id FROM core_banking.holds
       WHERE payment_id = $1
       ORDER BY created_at ASC
       LIMIT 1`,
      [paymentId],
    );
    return result.rows[0]?.id ?? null;
  }
}