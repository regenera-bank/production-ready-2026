/**
 * Sustainability port — contract boundary for ESG and carbon offset programs.
 */
export const SUSTAINABILITY_PORT = Symbol('SUSTAINABILITY_PORT');

export type SustainabilityAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface SustainabilityHealth {
  ok: boolean;
  domain: 'sustainability';
  adapter: SustainabilityAdapterKind;
}

export interface SustainabilityCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface SustainabilityResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface SustainabilityPort {
  readonly kind: SustainabilityAdapterKind;
  health(): Promise<SustainabilityHealth>;
  execute(command: SustainabilityCommand): Promise<SustainabilityResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
