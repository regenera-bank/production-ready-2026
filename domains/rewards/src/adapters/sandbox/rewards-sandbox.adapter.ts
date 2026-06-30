import { Injectable } from '@nestjs/common';
import {
  RewardsAdapterKind,
  RewardsCommand,
  RewardsHealth,
  RewardsPort,
  RewardsResult,
} from '../../ports/rewards.port';

@Injectable()
export class RewardsSandboxAdapter implements RewardsPort {
  readonly kind: RewardsAdapterKind = 'sandbox';
  private readonly store = new Map<string, RewardsResult>();

  async health(): Promise<RewardsHealth> {
    return { ok: true, domain: 'rewards', adapter: 'sandbox' };
  }

  async execute(command: RewardsCommand): Promise<RewardsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: RewardsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
