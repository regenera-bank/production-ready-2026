/**
 * Marketplace port — contract boundary for Partner marketplace catalog.
 */
export const MARKETPLACE_PORT = Symbol('MARKETPLACE_PORT');

export type MarketplaceAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface MarketplaceHealth {
  ok: boolean;
  domain: 'marketplace';
  adapter: MarketplaceAdapterKind;
}

export interface MarketplaceCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface MarketplaceResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface MarketplacePort {
  readonly kind: MarketplaceAdapterKind;
  health(): Promise<MarketplaceHealth>;
  execute(command: MarketplaceCommand): Promise<MarketplaceResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
