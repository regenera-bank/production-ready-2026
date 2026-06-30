/**
 * Insurance port — contract boundary for Insurance policy administration.
 */
export const INSURANCE_PORT = Symbol('INSURANCE_PORT');

export type InsuranceAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface InsuranceHealth {
  ok: boolean;
  domain: 'insurance';
  adapter: InsuranceAdapterKind;
}

export interface InsuranceCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface InsuranceResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface InsurancePort {
  readonly kind: InsuranceAdapterKind;
  health(): Promise<InsuranceHealth>;
  execute(command: InsuranceCommand): Promise<InsuranceResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
