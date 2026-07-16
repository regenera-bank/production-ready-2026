/**
 * Cards port — contract boundary for Card product lifecycle.
 */
export const CARDS_PORT = Symbol('CARDS_PORT');

export type CardsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface CardsHealth {
  ok: boolean;
  domain: 'cards';
  adapter: CardsAdapterKind;
}

export interface CardsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface CardsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface CardsPort {
  readonly kind: CardsAdapterKind;
  health(): Promise<CardsHealth>;
  execute(command: CardsCommand): Promise<CardsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
