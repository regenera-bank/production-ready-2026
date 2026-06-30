/**
 * Ledger port — contract boundary for Journal entries — delegates to @regenera/core-bank.
 * Delegation: production path targets @regenera/core-bank — see README.md.
 */
export const LEDGER_PORT = Symbol('LEDGER_PORT');

export type LedgerAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface LedgerHealth {
  ok: boolean;
  domain: 'ledger';
  adapter: LedgerAdapterKind;
}

export interface LedgerCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface LedgerResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface LedgerPort {
  readonly kind: LedgerAdapterKind;
  health(): Promise<LedgerHealth>;
  execute(command: LedgerCommand): Promise<LedgerResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
