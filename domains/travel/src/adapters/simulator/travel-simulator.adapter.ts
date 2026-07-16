import { Injectable } from '@nestjs/common';
import {
  TravelAdapterKind,
  TravelCommand,
  TravelHealth,
  TravelPort,
  TravelResult,
} from '../../ports/travel.port';

@Injectable()
export class TravelSimulatorAdapter implements TravelPort {
  readonly kind: TravelAdapterKind = 'simulator';
  private readonly ledger = new Map<string, TravelResult>();

  async health(): Promise<TravelHealth> {
    return { ok: true, domain: 'travel', adapter: 'simulator' };
  }

  async execute(command: TravelCommand): Promise<TravelResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: TravelResult = {
      referenceId: `sim-travel-${command.idempotencyKey}`,
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
