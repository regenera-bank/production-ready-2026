/**
 * Analytics port — contract boundary for Product analytics and insights.
 */
export const ANALYTICS_PORT = Symbol('ANALYTICS_PORT');

export type AnalyticsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface AnalyticsHealth {
  ok: boolean;
  domain: 'analytics';
  adapter: AnalyticsAdapterKind;
}

export interface AnalyticsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface AnalyticsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface AnalyticsPort {
  readonly kind: AnalyticsAdapterKind;
  health(): Promise<AnalyticsHealth>;
  execute(command: AnalyticsCommand): Promise<AnalyticsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
