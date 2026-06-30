import { Money } from '../money/money.value-object';

export enum HoldStatus {
  ACTIVE = 'ACTIVE',
  CONSUMED = 'CONSUMED',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED',
}

export interface HoldRecord {
  id: string;
  ledgerAccountId: string;
  amount: Money;
  status: HoldStatus;
  paymentId: string | null;
  expiresAt: string | null;
  createdAt: string;
  releasedAt: string | null;
}