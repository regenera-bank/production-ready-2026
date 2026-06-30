/**
 * Accounting port — contract boundary for Management accounting and chart of accounts.
 */
export const ACCOUNTING_PORT = Symbol('ACCOUNTING_PORT');

export type AccountingAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface AccountingHealth {
  ok: boolean;
  domain: 'accounting';
  adapter: AccountingAdapterKind;
}

export interface AccountingCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface AccountingResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface AccountingPort {
  readonly kind: AccountingAdapterKind;
  health(): Promise<AccountingHealth>;
  execute(command: AccountingCommand): Promise<AccountingResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
