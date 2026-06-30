/**
 * CardAuthorization port — contract boundary for Card authorization and limits at auth time.
 */
export const CARD_AUTHORIZATION_PORT = Symbol('CARD_AUTHORIZATION_PORT');

export type CardAuthorizationAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface CardAuthorizationHealth {
  ok: boolean;
  domain: 'card-authorization';
  adapter: CardAuthorizationAdapterKind;
}

export interface CardAuthorizationCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface CardAuthorizationResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface CardAuthorizationPort {
  readonly kind: CardAuthorizationAdapterKind;
  health(): Promise<CardAuthorizationHealth>;
  execute(command: CardAuthorizationCommand): Promise<CardAuthorizationResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
