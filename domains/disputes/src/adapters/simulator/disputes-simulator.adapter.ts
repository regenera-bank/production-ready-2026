import { Injectable } from '@nestjs/common';
import {
  DisputesAdapterKind,
  DisputesCommand,
  DisputesHealth,
  DisputesPort,
  DisputesResult,
} from '../../ports/disputes.port';

@Injectable()
export class DisputesSimulatorAdapter implements DisputesPort {
  readonly kind: DisputesAdapterKind = 'simulator';
  private readonly ledger = new Map<string, DisputesResult>();

  async health(): Promise<DisputesHealth> {
    return { ok: true, domain: 'disputes', adapter: 'simulator' };
  }

  async execute(command: DisputesCommand): Promise<DisputesResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: DisputesResult = {
      referenceId: `sim-disputes-${command.idempotencyKey}`,
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
