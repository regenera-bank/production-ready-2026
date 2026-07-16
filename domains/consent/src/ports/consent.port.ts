/**
 * Consent port — contract boundary for LGPD consent capture and revocation.
 */
export const CONSENT_PORT = Symbol('CONSENT_PORT');

export type ConsentAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface ConsentHealth {
  ok: boolean;
  domain: 'consent';
  adapter: ConsentAdapterKind;
}

export interface ConsentCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface ConsentResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface ConsentPort {
  readonly kind: ConsentAdapterKind;
  health(): Promise<ConsentHealth>;
  execute(command: ConsentCommand): Promise<ConsentResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
