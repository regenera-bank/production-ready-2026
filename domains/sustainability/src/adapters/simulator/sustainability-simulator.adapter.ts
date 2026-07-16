import { Injectable } from '@nestjs/common';
import {
  SustainabilityAdapterKind,
  SustainabilityCommand,
  SustainabilityHealth,
  SustainabilityPort,
  SustainabilityResult,
} from '../../ports/sustainability.port';

@Injectable()
export class SustainabilitySimulatorAdapter implements SustainabilityPort {
  readonly kind: SustainabilityAdapterKind = 'simulator';
  private readonly ledger = new Map<string, SustainabilityResult>();

  async health(): Promise<SustainabilityHealth> {
    return { ok: true, domain: 'sustainability', adapter: 'simulator' };
  }

  async execute(command: SustainabilityCommand): Promise<SustainabilityResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: SustainabilityResult = {
      referenceId: `sim-sustainability-${command.idempotencyKey}`,
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
