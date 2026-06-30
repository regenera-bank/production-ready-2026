import { Injectable } from '@nestjs/common';
import {
  EventsAdapterKind,
  EventsCommand,
  EventsHealth,
  EventsPort,
  EventsResult,
} from '../../ports/events.port';

@Injectable()
export class EventsSimulatorAdapter implements EventsPort {
  readonly kind: EventsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, EventsResult>();

  async health(): Promise<EventsHealth> {
    return { ok: true, domain: 'events', adapter: 'simulator' };
  }

  async execute(command: EventsCommand): Promise<EventsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: EventsResult = {
      referenceId: `sim-events-${command.idempotencyKey}`,
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
