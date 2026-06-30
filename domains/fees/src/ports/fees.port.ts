/**
 * Fees port — contract boundary for Fee schedules and accrual.
 */
export const FEES_PORT = Symbol('FEES_PORT');

export type FeesAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface FeesHealth {
  ok: boolean;
  domain: 'fees';
  adapter: FeesAdapterKind;
}

export interface FeesCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface FeesResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface FeesPort {
  readonly kind: FeesAdapterKind;
  health(): Promise<FeesHealth>;
  execute(command: FeesCommand): Promise<FeesResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
