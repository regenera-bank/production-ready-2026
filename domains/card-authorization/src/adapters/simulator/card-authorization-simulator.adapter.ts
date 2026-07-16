import { Injectable } from '@nestjs/common';
import {
  CardAuthorizationAdapterKind,
  CardAuthorizationCommand,
  CardAuthorizationHealth,
  CardAuthorizationPort,
  CardAuthorizationResult,
} from '../../ports/card-authorization.port';

@Injectable()
export class CardAuthorizationSimulatorAdapter implements CardAuthorizationPort {
  readonly kind: CardAuthorizationAdapterKind = 'simulator';
  private readonly ledger = new Map<string, CardAuthorizationResult>();

  async health(): Promise<CardAuthorizationHealth> {
    return { ok: true, domain: 'card-authorization', adapter: 'simulator' };
  }

  async execute(command: CardAuthorizationCommand): Promise<CardAuthorizationResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: CardAuthorizationResult = {
      referenceId: `sim-card-authorization-${command.idempotencyKey}`,
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
