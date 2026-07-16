import { Injectable } from '@nestjs/common';
import {
  CardAuthorizationAdapterKind,
  CardAuthorizationCommand,
  CardAuthorizationHealth,
  CardAuthorizationPort,
  CardAuthorizationResult,
} from '../../ports/card-authorization.port';

@Injectable()
export class CardAuthorizationSandboxAdapter implements CardAuthorizationPort {
  readonly kind: CardAuthorizationAdapterKind = 'sandbox';
  private readonly store = new Map<string, CardAuthorizationResult>();

  async health(): Promise<CardAuthorizationHealth> {
    return { ok: true, domain: 'card-authorization', adapter: 'sandbox' };
  }

  async execute(command: CardAuthorizationCommand): Promise<CardAuthorizationResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: CardAuthorizationResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
