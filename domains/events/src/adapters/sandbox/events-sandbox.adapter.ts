import { Injectable } from '@nestjs/common';
import {
  EventsAdapterKind,
  EventsCommand,
  EventsHealth,
  EventsPort,
  EventsResult,
} from '../../ports/events.port';

@Injectable()
export class EventsSandboxAdapter implements EventsPort {
  readonly kind: EventsAdapterKind = 'sandbox';
  private readonly store = new Map<string, EventsResult>();

  async health(): Promise<EventsHealth> {
    return { ok: true, domain: 'events', adapter: 'sandbox' };
  }

  async execute(command: EventsCommand): Promise<EventsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: EventsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
