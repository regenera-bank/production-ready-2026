import { Injectable } from '@nestjs/common';
import {
  TravelAdapterKind,
  TravelCommand,
  TravelHealth,
  TravelPort,
  TravelResult,
} from '../../ports/travel.port';

@Injectable()
export class TravelSandboxAdapter implements TravelPort {
  readonly kind: TravelAdapterKind = 'sandbox';
  private readonly store = new Map<string, TravelResult>();

  async health(): Promise<TravelHealth> {
    return { ok: true, domain: 'travel', adapter: 'sandbox' };
  }

  async execute(command: TravelCommand): Promise<TravelResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: TravelResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
