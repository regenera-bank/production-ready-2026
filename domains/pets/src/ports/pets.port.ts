/**
 * Pets port — contract boundary for Pet-related financial products.
 */
export const PETS_PORT = Symbol('PETS_PORT');

export type PetsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface PetsHealth {
  ok: boolean;
  domain: 'pets';
  adapter: PetsAdapterKind;
}

export interface PetsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface PetsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface PetsPort {
  readonly kind: PetsAdapterKind;
  health(): Promise<PetsHealth>;
  execute(command: PetsCommand): Promise<PetsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
