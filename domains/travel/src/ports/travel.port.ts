/**
 * Travel port — contract boundary for Travel benefits and FX helpers.
 */
export const TRAVEL_PORT = Symbol('TRAVEL_PORT');

export type TravelAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface TravelHealth {
  ok: boolean;
  domain: 'travel';
  adapter: TravelAdapterKind;
}

export interface TravelCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface TravelResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface TravelPort {
  readonly kind: TravelAdapterKind;
  health(): Promise<TravelHealth>;
  execute(command: TravelCommand): Promise<TravelResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
