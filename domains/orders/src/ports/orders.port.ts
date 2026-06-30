/**
 * Orders port — contract boundary for Order intake for tradable assets.
 */
export const ORDERS_PORT = Symbol('ORDERS_PORT');

export type OrdersAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface OrdersHealth {
  ok: boolean;
  domain: 'orders';
  adapter: OrdersAdapterKind;
}

export interface OrdersCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface OrdersResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface OrdersPort {
  readonly kind: OrdersAdapterKind;
  health(): Promise<OrdersHealth>;
  execute(command: OrdersCommand): Promise<OrdersResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
