/**
 * Senior port — contract boundary for Senior banking adaptations.
 */
export const SENIOR_PORT = Symbol('SENIOR_PORT');

export type SeniorAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface SeniorHealth {
  ok: boolean;
  domain: 'senior';
  adapter: SeniorAdapterKind;
}

export interface SeniorCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface SeniorResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface SeniorPort {
  readonly kind: SeniorAdapterKind;
  health(): Promise<SeniorHealth>;
  execute(command: SeniorCommand): Promise<SeniorResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
