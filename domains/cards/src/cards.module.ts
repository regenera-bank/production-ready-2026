import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CardsProductionAdapter } from './adapters/production/cards-production.adapter';
import { CardsSandboxAdapter } from './adapters/sandbox/cards-sandbox.adapter';
import { CardsSimulatorAdapter } from './adapters/simulator/cards-simulator.adapter';
import { CARDS_PORT, CardsAdapterKind } from './ports/cards.port';
import { CardsService } from './cards.service';

export interface CardsModuleOptions {
  adapter?: CardsAdapterKind;
}

function resolveAdapter(options?: CardsModuleOptions): CardsAdapterKind {
  const fromEnv = process.env.CARDS_ADAPTER as CardsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: CardsAdapterKind): Provider {
  const map = {
    simulator: CardsSimulatorAdapter,
    sandbox: CardsSandboxAdapter,
    production: CardsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: CARDS_PORT, useClass: impl };
}

@Module({})
export class CardsModule {
  static register(options?: CardsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: CardsModule,
      providers: [adapterProvider(kind), CardsService],
      exports: [CardsService, CARDS_PORT],
    };
  }
}
