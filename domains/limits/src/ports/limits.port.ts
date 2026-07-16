/**
 * Limits port — contract boundary for Transactional and product limits.
 */
export const LIMITS_PORT = Symbol('LIMITS_PORT');

export type LimitsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface LimitsHealth {
  ok: boolean;
  domain: 'limits';
  adapter: LimitsAdapterKind;
}

export interface LimitsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface LimitsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface LimitsPort {
  readonly kind: LimitsAdapterKind;
  health(): Promise<LimitsHealth>;
  execute(command: LimitsCommand): Promise<LimitsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
