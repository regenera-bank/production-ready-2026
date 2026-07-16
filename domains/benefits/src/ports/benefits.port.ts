/**
 * Benefits port — contract boundary for Employee and partner benefits.
 */
export const BENEFITS_PORT = Symbol('BENEFITS_PORT');

export type BenefitsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface BenefitsHealth {
  ok: boolean;
  domain: 'benefits';
  adapter: BenefitsAdapterKind;
}

export interface BenefitsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface BenefitsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface BenefitsPort {
  readonly kind: BenefitsAdapterKind;
  health(): Promise<BenefitsHealth>;
  execute(command: BenefitsCommand): Promise<BenefitsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
