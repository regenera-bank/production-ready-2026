import { Injectable } from '@nestjs/common';
import {
  CardsAdapterKind,
  CardsCommand,
  CardsHealth,
  CardsPort,
  CardsResult,
} from '../../ports/cards.port';

@Injectable()
export class CardsSandboxAdapter implements CardsPort {
  readonly kind: CardsAdapterKind = 'sandbox';
  private readonly store = new Map<string, CardsResult>();

  async health(): Promise<CardsHealth> {
    return { ok: true, domain: 'cards', adapter: 'sandbox' };
  }

  async execute(command: CardsCommand): Promise<CardsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: CardsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
