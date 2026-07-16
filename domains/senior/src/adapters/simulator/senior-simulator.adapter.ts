import { Injectable } from '@nestjs/common';
import {
  SeniorAdapterKind,
  SeniorCommand,
  SeniorHealth,
  SeniorPort,
  SeniorResult,
} from '../../ports/senior.port';

@Injectable()
export class SeniorSimulatorAdapter implements SeniorPort {
  readonly kind: SeniorAdapterKind = 'simulator';
  private readonly ledger = new Map<string, SeniorResult>();

  async health(): Promise<SeniorHealth> {
    return { ok: true, domain: 'senior', adapter: 'simulator' };
  }

  async execute(command: SeniorCommand): Promise<SeniorResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: SeniorResult = {
      referenceId: `sim-senior-${command.idempotencyKey}`,
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
