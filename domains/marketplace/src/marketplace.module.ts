import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MarketplaceProductionAdapter } from './adapters/production/marketplace-production.adapter';
import { MarketplaceSandboxAdapter } from './adapters/sandbox/marketplace-sandbox.adapter';
import { MarketplaceSimulatorAdapter } from './adapters/simulator/marketplace-simulator.adapter';
import { MARKETPLACE_PORT, MarketplaceAdapterKind } from './ports/marketplace.port';
import { MarketplaceService } from './marketplace.service';

export interface MarketplaceModuleOptions {
  adapter?: MarketplaceAdapterKind;
}

function resolveAdapter(options?: MarketplaceModuleOptions): MarketplaceAdapterKind {
  const fromEnv = process.env.MARKETPLACE_ADAPTER as MarketplaceAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: MarketplaceAdapterKind): Provider {
  const map = {
    simulator: MarketplaceSimulatorAdapter,
    sandbox: MarketplaceSandboxAdapter,
    production: MarketplaceProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: MARKETPLACE_PORT, useClass: impl };
}

@Module({})
export class MarketplaceModule {
  static register(options?: MarketplaceModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: MarketplaceModule,
      providers: [adapterProvider(kind), MarketplaceService],
      exports: [MarketplaceService, MARKETPLACE_PORT],
    };
  }
}
