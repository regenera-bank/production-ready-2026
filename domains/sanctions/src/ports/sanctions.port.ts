/**
 * Sanctions port — contract boundary for Sanctions screening and watchlists.
 */
export const SANCTIONS_PORT = Symbol('SANCTIONS_PORT');

export type SanctionsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface SanctionsHealth {
  ok: boolean;
  domain: 'sanctions';
  adapter: SanctionsAdapterKind;
}

export interface SanctionsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface SanctionsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface SanctionsPort {
  readonly kind: SanctionsAdapterKind;
  health(): Promise<SanctionsHealth>;
  execute(command: SanctionsCommand): Promise<SanctionsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
