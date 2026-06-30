import { Injectable } from '@nestjs/common';
import {
  DreamsAdapterKind,
  DreamsCommand,
  DreamsHealth,
  DreamsPort,
  DreamsResult,
} from '../../ports/dreams.port';

@Injectable()
export class DreamsSimulatorAdapter implements DreamsPort {
  readonly kind: DreamsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, DreamsResult>();

  async health(): Promise<DreamsHealth> {
    return { ok: true, domain: 'dreams', adapter: 'simulator' };
  }

  async execute(command: DreamsCommand): Promise<DreamsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: DreamsResult = {
      referenceId: `sim-dreams-${command.idempotencyKey}`,
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
