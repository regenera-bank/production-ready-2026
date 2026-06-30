import { Injectable } from '@nestjs/common';
import {
  PetsAdapterKind,
  PetsCommand,
  PetsHealth,
  PetsPort,
  PetsResult,
} from '../../ports/pets.port';

@Injectable()
export class PetsSimulatorAdapter implements PetsPort {
  readonly kind: PetsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, PetsResult>();

  async health(): Promise<PetsHealth> {
    return { ok: true, domain: 'pets', adapter: 'simulator' };
  }

  async execute(command: PetsCommand): Promise<PetsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: PetsResult = {
      referenceId: `sim-pets-${command.idempotencyKey}`,
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
