/**
 * Events port — contract boundary for Event ticketing and benefits.
 */
export const EVENTS_PORT = Symbol('EVENTS_PORT');

export type EventsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface EventsHealth {
  ok: boolean;
  domain: 'events';
  adapter: EventsAdapterKind;
}

export interface EventsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface EventsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface EventsPort {
  readonly kind: EventsAdapterKind;
  health(): Promise<EventsHealth>;
  execute(command: EventsCommand): Promise<EventsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
