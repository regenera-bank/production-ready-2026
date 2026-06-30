import { Money } from '../money/money.value-object';

export enum PaymentStatus {
  CREATED = 'CREATED',
  AUTHORIZED = 'AUTHORIZED',
  SENT = 'SENT',
  SETTLED = 'SETTLED',
  UNKNOWN = 'UNKNOWN',
  FAILED = 'FAILED',
  RECONCILED = 'RECONCILED',
}

export { ReconciliationResolution } from '../reconciliation/reconciliation.entity';

export interface CreatePaymentCommand {
  debtorAccountId: string;
  creditorAccountId: string;
  amount: Money;
  idempotencyKey: string;
  correlationId: string;
}

export interface PaymentRecord {
  id: string;
  status: PaymentStatus;
  debtorAccountId: string;
  creditorAccountId: string;
  amount: Money;
  idempotencyKey: string;
  correlationId: string;
  journalEntryId: string | null;
  holdId: string | null;
  createdAt: string;
  updatedAt: string;
}

const ALLOWED_TRANSITIONS: Readonly<
  Record<PaymentStatus, readonly PaymentStatus[]>
> = {
  [PaymentStatus.CREATED]: [PaymentStatus.SENT, PaymentStatus.FAILED],
  [PaymentStatus.AUTHORIZED]: [PaymentStatus.SENT, PaymentStatus.FAILED],
  [PaymentStatus.SENT]: [
    PaymentStatus.SETTLED,
    PaymentStatus.UNKNOWN,
    PaymentStatus.FAILED,
  ],
  [PaymentStatus.SETTLED]: [],
  [PaymentStatus.UNKNOWN]: [PaymentStatus.RECONCILED],
  [PaymentStatus.FAILED]: [],
  [PaymentStatus.RECONCILED]: [],
};

export function canTransitionPayment(
  from: PaymentStatus,
  to: PaymentStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}