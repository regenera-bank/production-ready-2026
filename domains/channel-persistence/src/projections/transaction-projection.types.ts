export type PaymentChannelState = 'SETTLED' | 'REJECTED' | 'PROCESSING';

export interface TransactionProjectionRecord {
  readonly id: string;
  readonly customerId: string;
  readonly paymentId: string;
  readonly transactionId: string;
  readonly correlationId: string;
  readonly idempotencyKey: string;
  readonly projectionSequence: bigint;
  readonly direction: 'inflow' | 'outflow';
  readonly amountCents: bigint;
  readonly currency: 'BRL';
  readonly title: string;
  readonly party: string;
  readonly channel: string;
  readonly paymentState: PaymentChannelState;
  readonly occurredAt: string;
  readonly projectedAt: string;
  readonly icon: string;
  readonly category: string;
}

export interface PaymentSettledOutboxEvent {
  readonly eventType: 'payment.settled';
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

export interface TransactionProjectionSnapshot {
  byCustomer: Record<string, TransactionProjectionRecord[]>;
  sequenceByCustomer: Record<string, string>;
}

export const emptyProjectionSnapshot = (): TransactionProjectionSnapshot => ({
  byCustomer: {},
  sequenceByCustomer: {},
});