/**
 * Notifications port — contract boundary for Outbound notification orchestration.
 */
export const NOTIFICATIONS_PORT = Symbol('NOTIFICATIONS_PORT');

export type NotificationsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface NotificationsHealth {
  ok: boolean;
  domain: 'notifications';
  adapter: NotificationsAdapterKind;
}

export interface NotificationsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface NotificationsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface NotificationsPort {
  readonly kind: NotificationsAdapterKind;
  health(): Promise<NotificationsHealth>;
  execute(command: NotificationsCommand): Promise<NotificationsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
