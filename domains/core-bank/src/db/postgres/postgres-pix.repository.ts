import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PixPaymentRecord } from '../../pix/pix.entity';
import { PixRepository } from '../../pix/pix.repository';
import { POSTGRES_POOL } from '../../storage/storage.tokens';
import { PgQueryable } from '../postgres-queryable';
import { mapPixRow } from './postgres-row-mappers';

@Injectable()
export class PostgresPixRepository implements PixRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  private db(client?: PgQueryable): PgQueryable {
    return client ?? this.pool;
  }

  async save(record: PixPaymentRecord, client?: PgQueryable): Promise<PixPaymentRecord> {
    const result = await this.db(client).query(
      `INSERT INTO core_banking.pix_payments (
         id, payment_id, end_to_end_id, receiver_key_hmac, receiver_masked,
         receiver_key_type, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         payment_id = EXCLUDED.payment_id,
         end_to_end_id = EXCLUDED.end_to_end_id,
         receiver_key_hmac = EXCLUDED.receiver_key_hmac,
         receiver_masked = EXCLUDED.receiver_masked,
         receiver_key_type = EXCLUDED.receiver_key_type
       RETURNING id, payment_id, end_to_end_id, receiver_key_hmac, receiver_masked,
                 receiver_key_type, created_at`,
      [
        record.id,
        record.paymentId,
        record.endToEndId,
        record.receiverKeyHmac,
        record.receiverMasked,
        record.receiverKeyType,
        record.createdAt,
      ],
    );
    return mapPixRow(result.rows[0]);
  }

  async findById(id: string): Promise<PixPaymentRecord | null> {
    const result = await this.pool.query(
      `SELECT id, payment_id, end_to_end_id, receiver_key_hmac, receiver_masked,
              receiver_key_type, created_at
       FROM core_banking.pix_payments WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) return null;
    return mapPixRow(result.rows[0]);
  }

  async findByPaymentId(paymentId: string): Promise<PixPaymentRecord | null> {
    const result = await this.pool.query(
      `SELECT id, payment_id, end_to_end_id, receiver_key_hmac, receiver_masked,
              receiver_key_type, created_at
       FROM core_banking.pix_payments WHERE payment_id = $1`,
      [paymentId],
    );
    if (result.rows.length === 0) return null;
    return mapPixRow(result.rows[0]);
  }

  async findByEndToEndId(endToEndId: string): Promise<PixPaymentRecord | null> {
    const result = await this.pool.query(
      `SELECT id, payment_id, end_to_end_id, receiver_key_hmac, receiver_masked,
              receiver_key_type, created_at
       FROM core_banking.pix_payments WHERE end_to_end_id = $1`,
      [endToEndId],
    );
    if (result.rows.length === 0) return null;
    return mapPixRow(result.rows[0]);
  }
}