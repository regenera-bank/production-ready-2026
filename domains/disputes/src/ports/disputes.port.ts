/**
 * Disputes port — contract boundary for Chargeback and dispute cases.
 */
export const DISPUTES_PORT = Symbol('DISPUTES_PORT');

export type DisputesAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface DisputesHealth {
  ok: boolean;
  domain: 'disputes';
  adapter: DisputesAdapterKind;
}

export interface DisputesCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface DisputesResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface DisputesPort {
  readonly kind: DisputesAdapterKind;
  health(): Promise<DisputesHealth>;
  execute(command: DisputesCommand): Promise<DisputesResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
