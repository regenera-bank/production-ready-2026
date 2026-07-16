/**
 * CardInvoices port — contract boundary for Card billing cycles and invoices.
 */
export const CARD_INVOICES_PORT = Symbol('CARD_INVOICES_PORT');

export type CardInvoicesAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface CardInvoicesHealth {
  ok: boolean;
  domain: 'card-invoices';
  adapter: CardInvoicesAdapterKind;
}

export interface CardInvoicesCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface CardInvoicesResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface CardInvoicesPort {
  readonly kind: CardInvoicesAdapterKind;
  health(): Promise<CardInvoicesHealth>;
  execute(command: CardInvoicesCommand): Promise<CardInvoicesResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
