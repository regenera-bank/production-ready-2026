/**
 * Aml port — contract boundary for Anti-money-laundering monitoring.
 */
export const AML_PORT = Symbol('AML_PORT');

export type AmlAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface AmlHealth {
  ok: boolean;
  domain: 'aml';
  adapter: AmlAdapterKind;
}

export interface AmlCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface AmlResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface AmlPort {
  readonly kind: AmlAdapterKind;
  health(): Promise<AmlHealth>;
  execute(command: AmlCommand): Promise<AmlResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
