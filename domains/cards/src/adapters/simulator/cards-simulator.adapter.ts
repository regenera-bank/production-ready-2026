import { Injectable } from '@nestjs/common';
import {
  CardsAdapterKind,
  CardsCommand,
  CardsHealth,
  CardsPort,
  CardsResult,
} from '../../ports/cards.port';

@Injectable()
export class CardsSimulatorAdapter implements CardsPort {
  readonly kind: CardsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, CardsResult>();

  async health(): Promise<CardsHealth> {
    return { ok: true, domain: 'cards', adapter: 'simulator' };
  }

  async execute(command: CardsCommand): Promise<CardsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: CardsResult = {
      referenceId: `sim-cards-${command.idempotencyKey}`,
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
