import { randomUUID } from 'crypto';
import {
  emptyProjectionSnapshot,
  type PaymentChannelState,
  type TransactionProjectionRecord,
  type TransactionProjectionSnapshot,
} from './transaction-projection.types';

export interface ApplyProjectionInput {
  readonly customerId: string;
  readonly paymentId: string;
  readonly transactionId: string;
  readonly correlationId: string;
  readonly idempotencyKey: string;
  readonly direction: 'inflow' | 'outflow';
  readonly amountCents: bigint;
  readonly title: string;
  readonly party: string;
  readonly channel: string;
  readonly paymentState: PaymentChannelState;
  readonly occurredAt: string;
  readonly icon: string;
  readonly category: string;
}

export class TransactionProjectionRepository {
  private snapshot: TransactionProjectionSnapshot = emptyProjectionSnapshot();

  get(): TransactionProjectionSnapshot {
    return this.snapshot;
  }

  reset(): void {
    this.snapshot = emptyProjectionSnapshot();
  }

  has(customerId: string, paymentId: string): boolean {
    const list = this.snapshot.byCustomer[customerId] ?? [];
    return list.some((row) => row.paymentId === paymentId);
  }

  listByCustomer(customerId: string): TransactionProjectionRecord[] {
    const list = this.snapshot.byCustomer[customerId] ?? [];
    return [...list].sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  }

  apply(input: ApplyProjectionInput): TransactionProjectionRecord | null {
    const list = this.snapshot.byCustomer[input.customerId] ?? [];
    if (list.some((row) => row.paymentId === input.paymentId)) {
      return null;
    }
    if (
      list.some(
        (row) =>
          row.customerId === input.customerId &&
          row.idempotencyKey === input.idempotencyKey,
      )
    ) {
      return null;
    }

    const prevSeq = BigInt(
      this.snapshot.sequenceByCustomer[input.customerId] ?? '0',
    );
    const nextSeq = prevSeq + 1n;
    const record: TransactionProjectionRecord = {
      id: randomUUID(),
      customerId: input.customerId,
      paymentId: input.paymentId,
      transactionId: input.transactionId,
      correlationId: input.correlationId,
      idempotencyKey: input.idempotencyKey,
      projectionSequence: nextSeq,
      direction: input.direction,
      amountCents: input.amountCents,
      currency: 'BRL',
      title: input.title,
      party: input.party,
      channel: input.channel,
      paymentState: input.paymentState,
      occurredAt: input.occurredAt,
      projectedAt: new Date().toISOString(),
      icon: input.icon,
      category: input.category,
    };

    const draft = structuredClone(this.snapshot);
    const customerRows = draft.byCustomer[input.customerId] ?? [];
    customerRows.unshift(record);
    draft.byCustomer[input.customerId] = customerRows;
    draft.sequenceByCustomer[input.customerId] = nextSeq.toString();
    this.snapshot = draft;
    return record;
  }
}