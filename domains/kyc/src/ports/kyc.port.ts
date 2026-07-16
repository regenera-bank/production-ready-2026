/**
 * Kyc port — contract boundary for Know-your-customer verification workflows.
 */
export const KYC_PORT = Symbol('KYC_PORT');

export type KycAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface KycHealth {
  ok: boolean;
  domain: 'kyc';
  adapter: KycAdapterKind;
}

export interface KycCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface KycResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface KycPort {
  readonly kind: KycAdapterKind;
  health(): Promise<KycHealth>;
  execute(command: KycCommand): Promise<KycResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
