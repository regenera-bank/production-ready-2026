import { Injectable } from '@nestjs/common';
import {
  LimitsAdapterKind,
  LimitsCommand,
  LimitsHealth,
  LimitsPort,
  LimitsResult,
} from '../../ports/limits.port';

@Injectable()
export class LimitsSimulatorAdapter implements LimitsPort {
  readonly kind: LimitsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, LimitsResult>();

  async health(): Promise<LimitsHealth> {
    return { ok: true, domain: 'limits', adapter: 'simulator' };
  }

  async execute(command: LimitsCommand): Promise<LimitsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: LimitsResult = {
      referenceId: `sim-limits-${command.idempotencyKey}`,
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
