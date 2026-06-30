import { Injectable } from '@nestjs/common';
import {
  MarketplaceAdapterKind,
  MarketplaceCommand,
  MarketplaceHealth,
  MarketplacePort,
  MarketplaceResult,
} from '../../ports/marketplace.port';

@Injectable()
export class MarketplaceSandboxAdapter implements MarketplacePort {
  readonly kind: MarketplaceAdapterKind = 'sandbox';
  private readonly store = new Map<string, MarketplaceResult>();

  async health(): Promise<MarketplaceHealth> {
    return { ok: true, domain: 'marketplace', adapter: 'sandbox' };
  }

  async execute(command: MarketplaceCommand): Promise<MarketplaceResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: MarketplaceResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
