/**
 * Accounts port — contract boundary for Ledger accounts — delegates to @regenera/core-bank.
 * Delegation: production path targets @regenera/core-bank — see README.md.
 */
export const ACCOUNTS_PORT = Symbol('ACCOUNTS_PORT');

export type AccountsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface AccountsHealth {
  ok: boolean;
  domain: 'accounts';
  adapter: AccountsAdapterKind;
}

export interface AccountsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface AccountsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface AccountsPort {
  readonly kind: AccountsAdapterKind;
  health(): Promise<AccountsHealth>;
  execute(command: AccountsCommand): Promise<AccountsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
