/**
 * Custody port — contract boundary for Asset custody and safekeeping.
 */
export const CUSTODY_PORT = Symbol('CUSTODY_PORT');

export type CustodyAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface CustodyHealth {
  ok: boolean;
  domain: 'custody';
  adapter: CustodyAdapterKind;
}

export interface CustodyCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface CustodyResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface CustodyPort {
  readonly kind: CustodyAdapterKind;
  health(): Promise<CustodyHealth>;
  execute(command: CustodyCommand): Promise<CustodyResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
