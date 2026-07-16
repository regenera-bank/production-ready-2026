/**
 * Kids port — contract boundary for Minor accounts and parental controls.
 */
export const KIDS_PORT = Symbol('KIDS_PORT');

export type KidsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface KidsHealth {
  ok: boolean;
  domain: 'kids';
  adapter: KidsAdapterKind;
}

export interface KidsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface KidsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface KidsPort {
  readonly kind: KidsAdapterKind;
  health(): Promise<KidsHealth>;
  execute(command: KidsCommand): Promise<KidsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
