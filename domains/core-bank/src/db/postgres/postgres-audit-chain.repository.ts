import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { AuditEventRecord } from '../../audit/audit-chain.entity';
import { AuditChainRepository } from '../../audit/audit-chain.repository';
import { POSTGRES_POOL } from '../../storage/storage.tokens';
import { PgQueryable } from '../postgres-queryable';
import { mapAuditRow } from './postgres-row-mappers';

@Injectable()
export class PostgresAuditChainRepository implements AuditChainRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  private db(client?: PgQueryable): PgQueryable {
    return client ?? this.pool;
  }

  async findLast(client?: PgQueryable): Promise<AuditEventRecord | null> {
    const result = await this.db(client).query(
      `SELECT id, event_type, payload, previous_hash, event_hash, correlation_id, created_at
       FROM core_banking.audit_events
       ORDER BY id DESC
       LIMIT 1`,
    );
    if (result.rows.length === 0) return null;
    return mapAuditRow(result.rows[0]);
  }

  async findAllOrdered(): Promise<AuditEventRecord[]> {
    const result = await this.pool.query(
      `SELECT id, event_type, payload, previous_hash, event_hash, correlation_id, created_at
       FROM core_banking.audit_events
       ORDER BY id ASC`,
    );
    return result.rows.map(mapAuditRow);
  }

  async append(
    event: Omit<AuditEventRecord, 'id'>,
    client?: PgQueryable,
  ): Promise<AuditEventRecord> {
    const result = await this.db(client).query(
      `INSERT INTO core_banking.audit_events (
         event_type, payload, previous_hash, event_hash, correlation_id, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, event_type, payload, previous_hash, event_hash, correlation_id, created_at`,
      [
        event.eventType,
        JSON.stringify(event.payload),
        event.previousHash,
        event.eventHash,
        event.correlationId,
        event.createdAt,
      ],
    );
    return mapAuditRow(result.rows[0]);
  }

  async replaceForTest(_id: number, _event: AuditEventRecord): Promise<void> {
    throw new Error(
      'replaceForTest is not supported in Postgres audit repository (append-only)',
    );
  }
}