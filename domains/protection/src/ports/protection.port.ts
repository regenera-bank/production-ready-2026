/**
 * Protection port — contract boundary for Insurance-like protection products.
 */
export const PROTECTION_PORT = Symbol('PROTECTION_PORT');

export type ProtectionAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface ProtectionHealth {
  ok: boolean;
  domain: 'protection';
  adapter: ProtectionAdapterKind;
}

export interface ProtectionCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface ProtectionResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface ProtectionPort {
  readonly kind: ProtectionAdapterKind;
  health(): Promise<ProtectionHealth>;
  execute(command: ProtectionCommand): Promise<ProtectionResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
