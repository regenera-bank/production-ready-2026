/**
 * Payments port — contract boundary for Payment engine — delegates to @regenera/core-bank.
 * Delegation: production path targets @regenera/core-bank — see README.md.
 */
export const PAYMENTS_PORT = Symbol('PAYMENTS_PORT');

export type PaymentsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface PaymentsHealth {
  ok: boolean;
  domain: 'payments';
  adapter: PaymentsAdapterKind;
}

export interface PaymentsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface PaymentsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface PaymentsPort {
  readonly kind: PaymentsAdapterKind;
  health(): Promise<PaymentsHealth>;
  execute(command: PaymentsCommand): Promise<PaymentsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
