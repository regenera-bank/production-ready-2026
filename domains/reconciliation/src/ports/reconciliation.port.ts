/**
 * Reconciliation port — contract boundary for UNKNOWN reconciliation — delegates to @regenera/core-bank.
 * Delegation: production path targets @regenera/core-bank — see README.md.
 */
export const RECONCILIATION_PORT = Symbol('RECONCILIATION_PORT');

export type ReconciliationAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface ReconciliationHealth {
  ok: boolean;
  domain: 'reconciliation';
  adapter: ReconciliationAdapterKind;
}

export interface ReconciliationCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface ReconciliationResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface ReconciliationPort {
  readonly kind: ReconciliationAdapterKind;
  health(): Promise<ReconciliationHealth>;
  execute(command: ReconciliationCommand): Promise<ReconciliationResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
