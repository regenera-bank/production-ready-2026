/**
 * Dreams port — contract boundary for Savings goals (dreams) product.
 */
export const DREAMS_PORT = Symbol('DREAMS_PORT');

export type DreamsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface DreamsHealth {
  ok: boolean;
  domain: 'dreams';
  adapter: DreamsAdapterKind;
}

export interface DreamsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface DreamsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface DreamsPort {
  readonly kind: DreamsAdapterKind;
  health(): Promise<DreamsHealth>;
  execute(command: DreamsCommand): Promise<DreamsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
