/**
 * Customers port — contract boundary for Customer profile and party registry.
 */
export const CUSTOMERS_PORT = Symbol('CUSTOMERS_PORT');

export type CustomersAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface CustomersHealth {
  ok: boolean;
  domain: 'customers';
  adapter: CustomersAdapterKind;
}

export interface CustomersCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface CustomersResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface CustomersPort {
  readonly kind: CustomersAdapterKind;
  health(): Promise<CustomersHealth>;
  execute(command: CustomersCommand): Promise<CustomersResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
