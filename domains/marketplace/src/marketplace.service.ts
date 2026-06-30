import { Inject, Injectable } from '@nestjs/common';
import { MARKETPLACE_PORT, MarketplaceCommand, MarketplacePort, MarketplaceResult } from './ports/marketplace.port';

@Injectable()
export class MarketplaceService {
  constructor(@Inject(MARKETPLACE_PORT) private readonly port: MarketplacePort) {}

  health() {
    return this.port.health();
  }

  execute(command: MarketplaceCommand): Promise<MarketplaceResult> {
    return this.port.execute(command);
  }
}
