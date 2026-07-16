import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  MarketplaceAdapterKind,
  MarketplaceCommand,
  MarketplaceHealth,
  MarketplacePort,
  MarketplaceResult,
} from '../../ports/marketplace.port';

@Injectable()
export class MarketplaceProductionAdapter implements MarketplacePort {
  readonly kind: MarketplaceAdapterKind = 'production';

  async health(): Promise<MarketplaceHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('marketplace', 'production');
  }

  async execute(_command: MarketplaceCommand): Promise<MarketplaceResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('marketplace', 'production');
  }
}
