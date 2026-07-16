/**
 * Credit port — contract boundary for Credit lines and lending products.
 */
export const CREDIT_PORT = Symbol('CREDIT_PORT');

export type CreditAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface CreditHealth {
  ok: boolean;
  domain: 'credit';
  adapter: CreditAdapterKind;
}

export interface CreditCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface CreditResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface CreditPort {
  readonly kind: CreditAdapterKind;
  health(): Promise<CreditHealth>;
  execute(command: CreditCommand): Promise<CreditResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
