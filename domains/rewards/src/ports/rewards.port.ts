/**
 * Rewards port — contract boundary for Loyalty points and rewards.
 */
export const REWARDS_PORT = Symbol('REWARDS_PORT');

export type RewardsAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface RewardsHealth {
  ok: boolean;
  domain: 'rewards';
  adapter: RewardsAdapterKind;
}

export interface RewardsCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface RewardsResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface RewardsPort {
  readonly kind: RewardsAdapterKind;
  health(): Promise<RewardsHealth>;
  execute(command: RewardsCommand): Promise<RewardsResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
