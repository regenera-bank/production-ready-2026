import { Pool } from 'pg';
import { OutboxEventSnapshot, OutboxStore } from './outbox-store';

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapOutboxRow(row: {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  published_at: Date | string | null;
  created_at: Date | string;
}): OutboxEventSnapshot {
  return {
    id: row.id,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    eventType: row.event_type,
    payload: row.payload,
    publishedAt: row.published_at ? toIso(row.published_at) : null,
    createdAt: toIso(row.created_at),
  };
}

/** Adapter Postgres para core_banking.outbox_events — usado em produção */
export class PostgresOutboxStore implements OutboxStore {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<OutboxEventSnapshot | null> {
    const result = await this.pool.query(
      `SELECT id, aggregate_type, aggregate_id, event_type, payload, published_at, created_at
       FROM core_banking.outbox_events WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return mapOutboxRow(result.rows[0]);
  }

  async markPublished(
    id: string,
    publishedAt?: string,
  ): Promise<OutboxEventSnapshot> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`outbox event not found: ${id}`);
    }

    if (existing.publishedAt !== null) {
      return existing;
    }

    const publishedAtValue = publishedAt ?? new Date().toISOString();
    const result = await this.pool.query(
      `UPDATE core_banking.outbox_events
       SET published_at = $2
       WHERE id = $1
       RETURNING id, aggregate_type, aggregate_id, event_type, payload, published_at, created_at`,
      [id, publishedAtValue],
    );

    if (result.rows.length === 0) {
      throw new Error(`outbox event not found: ${id}`);
    }

    return mapOutboxRow(result.rows[0]);
  }
}