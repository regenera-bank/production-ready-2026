import { Injectable } from '@nestjs/common';
import {
  RewardsAdapterKind,
  RewardsCommand,
  RewardsHealth,
  RewardsPort,
  RewardsResult,
} from '../../ports/rewards.port';

@Injectable()
export class RewardsSimulatorAdapter implements RewardsPort {
  readonly kind: RewardsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, RewardsResult>();

  async health(): Promise<RewardsHealth> {
    return { ok: true, domain: 'rewards', adapter: 'simulator' };
  }

  async execute(command: RewardsCommand): Promise<RewardsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: RewardsResult = {
      referenceId: `sim-rewards-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: {
        simulated: true,
        principalId: command.principalId,
        payloadKeys: Object.keys(command.payload).sort(),
      },
    };
    this.ledger.set(command.idempotencyKey, result);
    return result;
  }
}
