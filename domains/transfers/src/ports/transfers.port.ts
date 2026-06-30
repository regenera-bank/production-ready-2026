/**
 * Transfers port — contract boundary for TED/DOC and internal transfer orchestration.
 */
export const TRANSFERS_PORT = Symbol('TRANSFERS_PORT');

export type TransfersAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface TransfersHealth {
  ok: boolean;
  domain: 'transfers';
  adapter: TransfersAdapterKind;
}

export interface TransfersCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface TransfersResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface TransfersPort {
  readonly kind: TransfersAdapterKind;
  health(): Promise<TransfersHealth>;
  execute(command: TransfersCommand): Promise<TransfersResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
