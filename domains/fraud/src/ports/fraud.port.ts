/**
 * Fraud port — contract boundary for Fraud scoring and decisioning.
 */
export const FRAUD_PORT = Symbol('FRAUD_PORT');

export type FraudAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface FraudHealth {
  ok: boolean;
  domain: 'fraud';
  adapter: FraudAdapterKind;
}

export interface FraudCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface FraudResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface FraudPort {
  readonly kind: FraudAdapterKind;
  health(): Promise<FraudHealth>;
  execute(command: FraudCommand): Promise<FraudResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
