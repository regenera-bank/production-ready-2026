/**
 * Investments port — contract boundary for Investment positions and orders.
 */
export const INVESTMENTS_PORT = Symbol('INVESTMENTS_PORT');

export type InvestmentsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface InvestmentsHealth {
  ok: boolean;
  domain: 'investments';
  adapter: InvestmentsAdapterKind;
}

export interface InvestmentsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface InvestmentsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface InvestmentsPort {
  readonly kind: InvestmentsAdapterKind;
  health(): Promise<InvestmentsHealth>;
  execute(command: InvestmentsCommand): Promise<InvestmentsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
