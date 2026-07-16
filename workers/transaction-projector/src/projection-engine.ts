import { Pool } from 'pg';

export interface OutboxPaymentSettledRow {
  readonly customerId: string;
  readonly paymentId: string;
  readonly transactionId: string;
  readonly correlationId: string;
  readonly idempotencyKey: string;
  readonly direction: 'inflow' | 'outflow';
  readonly amountCents: string;
  readonly title: string;
  readonly party: string;
  readonly channel: string;
  readonly icon: string;
  readonly category: string;
  readonly occurredAt: string;
}

export interface ProjectionEngineResult {
  readonly applied: boolean;
  readonly projectionId?: string;
}

export async function projectPaymentSettled(
  pool: Pool,
  row: OutboxPaymentSettledRow,
): Promise<ProjectionEngineResult> {
  const cents = BigInt(row.amountCents);
  if (cents <= 0n) {
    return { applied: false };
  }

  const customer = await pool.query<{ id: string }>(
    `SELECT id FROM channel_experience.customers WHERE external_ref = $1 LIMIT 1`,
    [row.customerId],
  );
  const customerId = customer.rows[0]?.id;
  if (!customerId) {
    return { applied: false };
  }

  const seqRow = await pool.query<{ next_seq: string }>(
    `SELECT COALESCE(MAX(projection_sequence), 0) + 1 AS next_seq
     FROM channel_experience.transaction_projections WHERE customer_id = $1::uuid`,
    [customerId],
  );
  const nextSeq = seqRow.rows[0]?.next_seq ?? '1';

  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO channel_experience.transaction_projections
       (customer_id, payment_id, transaction_id, correlation_id, idempotency_key,
        projection_sequence, direction, amount_cents, title, party, channel,
        payment_state, occurred_at)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'SETTLED', $12::timestamptz)
     ON CONFLICT (customer_id, payment_id) DO NOTHING
     RETURNING id`,
    [
      customerId,
      row.paymentId,
      row.transactionId,
      row.correlationId,
      row.idempotencyKey,
      nextSeq,
      row.direction,
      row.amountCents,
      row.title,
      row.party,
      row.channel,
      row.occurredAt,
    ],
  );

  return {
    applied: Boolean(inserted.rows[0]),
    projectionId: inserted.rows[0]?.id,
  };
}

export async function processPendingOutbox(pool: Pool): Promise<number> {
  const pending = await pool.query<{
    id: string;
    event_type: string;
    payload: OutboxPaymentSettledRow;
  }>(
    `SELECT id, event_type, payload
     FROM channel_experience.projector_outbox
     WHERE processed_at IS NULL
     ORDER BY created_at ASC
     LIMIT 20`,
  );

  let applied = 0;
  for (const row of pending.rows) {
    if (row.event_type === 'payment.settled') {
      const result = await projectPaymentSettled(pool, row.payload);
      if (result.applied) {
        applied += 1;
      }
    }
    await pool.query(
      `UPDATE channel_experience.projector_outbox SET processed_at = now() WHERE id = $1::uuid`,
      [row.id],
    );
  }
  return applied;
}