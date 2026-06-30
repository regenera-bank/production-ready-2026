import { Injectable } from '@nestjs/common';
import {
  CollectionsAdapterKind,
  CollectionsCommand,
  CollectionsHealth,
  CollectionsPort,
  CollectionsResult,
} from '../../ports/collections.port';

@Injectable()
export class CollectionsSimulatorAdapter implements CollectionsPort {
  readonly kind: CollectionsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, CollectionsResult>();

  async health(): Promise<CollectionsHealth> {
    return { ok: true, domain: 'collections', adapter: 'simulator' };
  }

  async execute(command: CollectionsCommand): Promise<CollectionsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: CollectionsResult = {
      referenceId: `sim-collections-${command.idempotencyKey}`,
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
