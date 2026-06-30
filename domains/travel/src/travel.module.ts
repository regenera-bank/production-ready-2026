import { DynamicModule, Module, Provider } from '@nestjs/common';
import { TravelProductionAdapter } from './adapters/production/travel-production.adapter';
import { TravelSandboxAdapter } from './adapters/sandbox/travel-sandbox.adapter';
import { TravelSimulatorAdapter } from './adapters/simulator/travel-simulator.adapter';
import { TRAVEL_PORT, TravelAdapterKind } from './ports/travel.port';
import { TravelService } from './travel.service';

export interface TravelModuleOptions {
  adapter?: TravelAdapterKind;
}

function resolveAdapter(options?: TravelModuleOptions): TravelAdapterKind {
  const fromEnv = process.env.TRAVEL_ADAPTER as TravelAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: TravelAdapterKind): Provider {
  const map = {
    simulator: TravelSimulatorAdapter,
    sandbox: TravelSandboxAdapter,
    production: TravelProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: TRAVEL_PORT, useClass: impl };
}

@Module({})
export class TravelModule {
  static register(options?: TravelModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: TravelModule,
      providers: [adapterProvider(kind), TravelService],
      exports: [TravelService, TRAVEL_PORT],
    };
  }
}
