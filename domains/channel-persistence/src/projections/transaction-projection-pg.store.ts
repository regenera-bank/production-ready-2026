import { Pool } from 'pg';
import type { ApplyProjectionInput } from './transaction-projection.repository';
import type { TransactionProjectionRecord } from './transaction-projection.types';

export class TransactionProjectionPgStore {
  constructor(private readonly pool: Pool) {}

  async resolveCustomerUuid(externalRef: string): Promise<string | null> {
    const row = await this.pool.query<{ id: string }>(
      `SELECT id FROM channel_experience.customers WHERE external_ref = $1 LIMIT 1`,
      [externalRef],
    );
    return row.rows[0]?.id ?? null;
  }

  async apply(input: ApplyProjectionInput): Promise<TransactionProjectionRecord | null> {
    const customerUuid = await this.resolveCustomerUuid(input.customerId);
    if (!customerUuid) {
      return null;
    }
    const seqRow = await this.pool.query<{ next_seq: string }>(
      `SELECT COALESCE(MAX(projection_sequence), 0) + 1 AS next_seq
       FROM channel_experience.transaction_projections
       WHERE customer_id = $1::uuid`,
      [customerUuid],
    );
    const nextSeq = BigInt(seqRow.rows[0]?.next_seq ?? '1');
    const inserted = await this.pool.query<{
      id: string;
      payment_id: string;
      transaction_id: string;
      correlation_id: string;
      idempotency_key: string;
      projection_sequence: string;
      direction: string;
      amount_cents: string;
      title: string;
      party: string;
      channel: string;
      payment_state: string;
      occurred_at: Date;
      projected_at: Date;
    }>(
      `INSERT INTO channel_experience.transaction_projections
         (customer_id, payment_id, transaction_id, correlation_id, idempotency_key,
          projection_sequence, direction, amount_cents, title, party, channel,
          payment_state, occurred_at)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::channel_experience.payment_channel_state, $13::timestamptz)
       ON CONFLICT (customer_id, payment_id) DO NOTHING
       RETURNING id, payment_id, transaction_id, correlation_id, idempotency_key,
                 projection_sequence, direction, amount_cents::text, title, party, channel,
                 payment_state::text, occurred_at, projected_at`,
      [
        customerUuid,
        input.paymentId,
        input.transactionId,
        input.correlationId,
        input.idempotencyKey,
        nextSeq.toString(),
        input.direction,
        input.amountCents.toString(),
        input.title,
        input.party,
        input.channel,
        input.paymentState,
        input.occurredAt,
      ],
    );
    const row = inserted.rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      customerId: input.customerId,
      paymentId: row.payment_id,
      transactionId: row.transaction_id,
      correlationId: row.correlation_id,
      idempotencyKey: row.idempotency_key,
      projectionSequence: BigInt(row.projection_sequence),
      direction: row.direction as 'inflow' | 'outflow',
      amountCents: BigInt(row.amount_cents),
      currency: 'BRL',
      title: row.title,
      party: row.party,
      channel: row.channel,
      paymentState: row.payment_state as TransactionProjectionRecord['paymentState'],
      occurredAt: row.occurred_at.toISOString(),
      projectedAt: row.projected_at.toISOString(),
      icon: input.icon,
      category: input.category,
    };
  }

  async listByCustomer(externalRef: string): Promise<TransactionProjectionRecord[]> {
    const customerUuid = await this.resolveCustomerUuid(externalRef);
    if (!customerUuid) {
      return [];
    }
    const rows = await this.pool.query<{
      id: string;
      payment_id: string;
      transaction_id: string;
      correlation_id: string;
      idempotency_key: string;
      projection_sequence: string;
      direction: string;
      amount_cents: string;
      title: string;
      party: string;
      channel: string;
      payment_state: string;
      occurred_at: Date;
      projected_at: Date;
    }>(
      `SELECT id, payment_id, transaction_id, correlation_id, idempotency_key,
              projection_sequence, direction, amount_cents::text, title, party, channel,
              payment_state::text, occurred_at, projected_at
       FROM channel_experience.transaction_projections
       WHERE customer_id = $1::uuid
       ORDER BY occurred_at DESC`,
      [customerUuid],
    );
    return rows.rows.map((row) => ({
      id: row.id,
      customerId: externalRef,
      paymentId: row.payment_id,
      transactionId: row.transaction_id,
      correlationId: row.correlation_id,
      idempotencyKey: row.idempotency_key,
      projectionSequence: BigInt(row.projection_sequence),
      direction: row.direction as 'inflow' | 'outflow',
      amountCents: BigInt(row.amount_cents),
      currency: 'BRL' as const,
      title: row.title,
      party: row.party,
      channel: row.channel,
      paymentState: row.payment_state as TransactionProjectionRecord['paymentState'],
      occurredAt: row.occurred_at.toISOString(),
      projectedAt: row.projected_at.toISOString(),
      icon: 'send',
      category: 'essential',
    }));
  }

  async enqueueOutbox(eventType: string, payload: unknown): Promise<void> {
    await this.pool.query(
      `INSERT INTO channel_experience.projector_outbox (event_type, payload) VALUES ($1, $2::jsonb)`,
      [eventType, JSON.stringify(payload)],
    );
  }
}