import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { ReconciliationCaseRecord } from '../../reconciliation/reconciliation.entity';
import { ReconciliationRepository } from '../../reconciliation/reconciliation.repository';
import { POSTGRES_POOL } from '../../storage/storage.tokens';
import { PgQueryable } from '../postgres-queryable';
import { mapReconciliationRow } from './postgres-row-mappers';

@Injectable()
export class PostgresReconciliationRepository implements ReconciliationRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  private db(client?: PgQueryable): PgQueryable {
    return client ?? this.pool;
  }

  async save(
    reconciliationCase: ReconciliationCaseRecord,
    client?: PgQueryable,
  ): Promise<ReconciliationCaseRecord> {
    const result = await this.db(client).query(
      `INSERT INTO core_banking.reconciliation_cases (
         id, payment_id, status, evidence_ref, maker_id, checker_id, created_at, resolved_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         checker_id = EXCLUDED.checker_id,
         resolved_at = EXCLUDED.resolved_at
       RETURNING id, payment_id, status, evidence_ref, maker_id, checker_id, created_at, resolved_at`,
      [
        reconciliationCase.id,
        reconciliationCase.paymentId,
        reconciliationCase.status,
        reconciliationCase.evidenceRef,
        reconciliationCase.makerId,
        reconciliationCase.checkerId,
        reconciliationCase.createdAt,
        reconciliationCase.resolvedAt,
      ],
    );
    return mapReconciliationRow(result.rows[0]);
  }

  async findById(id: string): Promise<ReconciliationCaseRecord | null> {
    const result = await this.pool.query(
      `SELECT id, payment_id, status, evidence_ref, maker_id, checker_id, created_at, resolved_at
       FROM core_banking.reconciliation_cases WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) return null;
    return mapReconciliationRow(result.rows[0]);
  }

  async findOpenByPayment(paymentId: string): Promise<ReconciliationCaseRecord | null> {
    const result = await this.pool.query(
      `SELECT id, payment_id, status, evidence_ref, maker_id, checker_id, created_at, resolved_at
       FROM core_banking.reconciliation_cases
       WHERE payment_id = $1 AND status = 'OPEN'`,
      [paymentId],
    );
    if (result.rows.length === 0) return null;
    return mapReconciliationRow(result.rows[0]);
  }
}