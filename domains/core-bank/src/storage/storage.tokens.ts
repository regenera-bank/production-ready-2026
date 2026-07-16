import { AccountRepository } from '../accounts/account.repository';
import { AuditChainRepository } from '../audit/audit-chain.repository';
import { HoldRepository } from '../holds/hold.repository';
import { IdempotencyRepository } from '../idempotency/idempotency.repository';
import { LedgerRepository } from '../ledger/ledger.repository';
import { OutboxRepository } from '../outbox/outbox.repository';
import { PaymentRepository } from '../payments/payment.repository';
import { PixRepository } from '../pix/pix.repository';
import { ReconciliationRepository } from '../reconciliation/reconciliation.repository';

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');
export const LEDGER_REPOSITORY = Symbol('LEDGER_REPOSITORY');
export const IDEMPOTENCY_REPOSITORY = Symbol('IDEMPOTENCY_REPOSITORY');
export const OUTBOX_REPOSITORY = Symbol('OUTBOX_REPOSITORY');
export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');
export const HOLD_REPOSITORY = Symbol('HOLD_REPOSITORY');
export const AUDIT_CHAIN_REPOSITORY = Symbol('AUDIT_CHAIN_REPOSITORY');
export const RECONCILIATION_REPOSITORY = Symbol('RECONCILIATION_REPOSITORY');
export const PIX_REPOSITORY = Symbol('PIX_REPOSITORY');
export const POSTGRES_POOL = Symbol('POSTGRES_POOL');

export type StorageMode = 'postgres' | 'memory';

export interface RepositoryTokens {
  account: symbol;
  ledger: symbol;
  idempotency: symbol;
  outbox: symbol;
  payment: symbol;
  hold: symbol;
  audit: symbol;
  reconciliation: symbol;
  pix: symbol;
}

export const REPOSITORY_TOKEN_MAP: RepositoryTokens = {
  account: ACCOUNT_REPOSITORY,
  ledger: LEDGER_REPOSITORY,
  idempotency: IDEMPOTENCY_REPOSITORY,
  outbox: OUTBOX_REPOSITORY,
  payment: PAYMENT_REPOSITORY,
  hold: HOLD_REPOSITORY,
  audit: AUDIT_CHAIN_REPOSITORY,
  reconciliation: RECONCILIATION_REPOSITORY,
  pix: PIX_REPOSITORY,
};

export type RepositoryInterfaces = {
  account: AccountRepository;
  ledger: LedgerRepository;
  idempotency: IdempotencyRepository;
  outbox: OutboxRepository;
  payment: PaymentRepository;
  hold: HoldRepository;
  audit: AuditChainRepository;
  reconciliation: ReconciliationRepository;
  pix: PixRepository;
};