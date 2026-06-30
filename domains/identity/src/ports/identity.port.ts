/**
 * Identity port — contract boundary for Authentication, MFA, and principal lifecycle.
 */
export const IDENTITY_PORT = Symbol('IDENTITY_PORT');

export type IdentityAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface IdentityHealth {
  ok: boolean;
  domain: 'identity';
  adapter: IdentityAdapterKind;
}

export interface IdentityCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface IdentityResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface IdentityPort {
  readonly kind: IdentityAdapterKind;
  health(): Promise<IdentityHealth>;
  execute(command: IdentityCommand): Promise<IdentityResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
