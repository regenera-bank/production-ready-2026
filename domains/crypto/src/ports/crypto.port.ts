/**
 * Crypto port — contract boundary for Virtual assets program (regulatory gate).
 */
export const CRYPTO_PORT = Symbol('CRYPTO_PORT');

export type CryptoAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface CryptoHealth {
  ok: boolean;
  domain: 'crypto';
  adapter: CryptoAdapterKind;
}

export interface CryptoCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface CryptoResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface CryptoPort {
  readonly kind: CryptoAdapterKind;
  health(): Promise<CryptoHealth>;
  execute(command: CryptoCommand): Promise<CryptoResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
export const REGULATORY_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires regulatory activation — feature flag off`), {
    code: 'REGULATORY_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
