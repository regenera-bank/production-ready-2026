import { Injectable } from '@nestjs/common';
import {
  FeesAdapterKind,
  FeesCommand,
  FeesHealth,
  FeesPort,
  FeesResult,
} from '../../ports/fees.port';

@Injectable()
export class FeesSimulatorAdapter implements FeesPort {
  readonly kind: FeesAdapterKind = 'simulator';
  private readonly ledger = new Map<string, FeesResult>();

  async health(): Promise<FeesHealth> {
    return { ok: true, domain: 'fees', adapter: 'simulator' };
  }

  async execute(command: FeesCommand): Promise<FeesResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: FeesResult = {
      referenceId: `sim-fees-${command.idempotencyKey}`,
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
