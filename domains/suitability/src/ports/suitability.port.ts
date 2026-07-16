/**
 * Suitability port — contract boundary for Investor suitability profiling.
 */
export const SUITABILITY_PORT = Symbol('SUITABILITY_PORT');

export type SuitabilityAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface SuitabilityHealth {
  ok: boolean;
  domain: 'suitability';
  adapter: SuitabilityAdapterKind;
}

export interface SuitabilityCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface SuitabilityResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface SuitabilityPort {
  readonly kind: SuitabilityAdapterKind;
  health(): Promise<SuitabilityHealth>;
  execute(command: SuitabilityCommand): Promise<SuitabilityResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
