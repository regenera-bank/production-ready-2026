import { Injectable } from '@nestjs/common';
import {
  CollectionsAdapterKind,
  CollectionsCommand,
  CollectionsHealth,
  CollectionsPort,
  CollectionsResult,
} from '../../ports/collections.port';

@Injectable()
export class CollectionsSandboxAdapter implements CollectionsPort {
  readonly kind: CollectionsAdapterKind = 'sandbox';
  private readonly store = new Map<string, CollectionsResult>();

  async health(): Promise<CollectionsHealth> {
    return { ok: true, domain: 'collections', adapter: 'sandbox' };
  }

  async execute(command: CollectionsCommand): Promise<CollectionsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: CollectionsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
