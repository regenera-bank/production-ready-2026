import { Injectable } from '@nestjs/common';
import {
  MarketplaceAdapterKind,
  MarketplaceCommand,
  MarketplaceHealth,
  MarketplacePort,
  MarketplaceResult,
} from '../../ports/marketplace.port';

@Injectable()
export class MarketplaceSimulatorAdapter implements MarketplacePort {
  readonly kind: MarketplaceAdapterKind = 'simulator';
  private readonly ledger = new Map<string, MarketplaceResult>();

  async health(): Promise<MarketplaceHealth> {
    return { ok: true, domain: 'marketplace', adapter: 'simulator' };
  }

  async execute(command: MarketplaceCommand): Promise<MarketplaceResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: MarketplaceResult = {
      referenceId: `sim-marketplace-${command.idempotencyKey}`,
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
