/**
 * Transactions port — contract boundary for Customer-facing transaction history and receipts.
 */
export const TRANSACTIONS_PORT = Symbol('TRANSACTIONS_PORT');

export type TransactionsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface TransactionsHealth {
  ok: boolean;
  domain: 'transactions';
  adapter: TransactionsAdapterKind;
}

export interface TransactionsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface TransactionsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface TransactionsPort {
  readonly kind: TransactionsAdapterKind;
  health(): Promise<TransactionsHealth>;
  execute(command: TransactionsCommand): Promise<TransactionsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
