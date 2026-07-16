import { Injectable } from '@nestjs/common';
import {
  SuitabilityAdapterKind,
  SuitabilityCommand,
  SuitabilityHealth,
  SuitabilityPort,
  SuitabilityResult,
} from '../../ports/suitability.port';

@Injectable()
export class SuitabilitySimulatorAdapter implements SuitabilityPort {
  readonly kind: SuitabilityAdapterKind = 'simulator';
  private readonly ledger = new Map<string, SuitabilityResult>();

  async health(): Promise<SuitabilityHealth> {
    return { ok: true, domain: 'suitability', adapter: 'simulator' };
  }

  async execute(command: SuitabilityCommand): Promise<SuitabilityResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: SuitabilityResult = {
      referenceId: `sim-suitability-${command.idempotencyKey}`,
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
