/**
 * Collections port — contract boundary for Delinquency and collections workflows.
 */
export const COLLECTIONS_PORT = Symbol('COLLECTIONS_PORT');

export type CollectionsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface CollectionsHealth {
  ok: boolean;
  domain: 'collections';
  adapter: CollectionsAdapterKind;
}

export interface CollectionsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface CollectionsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface CollectionsPort {
  readonly kind: CollectionsAdapterKind;
  health(): Promise<CollectionsHealth>;
  execute(command: CollectionsCommand): Promise<CollectionsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
