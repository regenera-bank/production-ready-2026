import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { OutboxEventRecord } from '../../outbox/outbox.entity';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { POSTGRES_POOL } from '../../storage/storage.tokens';
import { PgQueryable } from '../postgres-queryable';
import { mapOutboxRow } from './postgres-row-mappers';

@Injectable()
export class PostgresOutboxRepository implements OutboxRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  private db(client?: PgQueryable): PgQueryable {
    return client ?? this.pool;
  }

  async append(event: OutboxEventRecord, client?: PgQueryable): Promise<OutboxEventRecord> {
    const result = await this.db(client).query(
      `INSERT INTO core_banking.outbox_events (
         id, aggregate_type, aggregate_id, event_type, payload, published_at, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, aggregate_type, aggregate_id, event_type, payload, published_at, created_at`,
      [
        event.id,
        event.aggregateType,
        event.aggregateId,
        event.eventType,
        JSON.stringify(event.payload),
        event.publishedAt,
        event.createdAt,
      ],
    );
    return mapOutboxRow(result.rows[0]);
  }

  async findById(id: string): Promise<OutboxEventRecord | null> {
    const result = await this.pool.query(
      `SELECT id, aggregate_type, aggregate_id, event_type, payload, published_at, created_at
       FROM core_banking.outbox_events WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) return null;
    return mapOutboxRow(result.rows[0]);
  }

  async findPending(limit: number): Promise<OutboxEventRecord[]> {
    const result = await this.pool.query(
      `SELECT id, aggregate_type, aggregate_id, event_type, payload, published_at, created_at
       FROM core_banking.outbox_events
       WHERE published_at IS NULL
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit],
    );
    return result.rows.map(mapOutboxRow);
  }

  async updatePublishedAt(
    id: string,
    publishedAt: string,
  ): Promise<OutboxEventRecord> {
    const result = await this.pool.query(
      `UPDATE core_banking.outbox_events
       SET published_at = $2
       WHERE id = $1
       RETURNING id, aggregate_type, aggregate_id, event_type, payload, published_at, created_at`,
      [id, publishedAt],
    );
    if (result.rows.length === 0) {
      throw new Error(`outbox event not found: ${id}`);
    }
    return mapOutboxRow(result.rows[0]);
  }
}