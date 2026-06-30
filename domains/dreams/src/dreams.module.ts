import { DynamicModule, Module, Provider } from '@nestjs/common';
import { DreamsProductionAdapter } from './adapters/production/dreams-production.adapter';
import { DreamsSandboxAdapter } from './adapters/sandbox/dreams-sandbox.adapter';
import { DreamsSimulatorAdapter } from './adapters/simulator/dreams-simulator.adapter';
import { DREAMS_PORT, DreamsAdapterKind } from './ports/dreams.port';
import { DreamsService } from './dreams.service';

export interface DreamsModuleOptions {
  adapter?: DreamsAdapterKind;
}

function resolveAdapter(options?: DreamsModuleOptions): DreamsAdapterKind {
  const fromEnv = process.env.DREAMS_ADAPTER as DreamsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: DreamsAdapterKind): Provider {
  const map = {
    simulator: DreamsSimulatorAdapter,
    sandbox: DreamsSandboxAdapter,
    production: DreamsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: DREAMS_PORT, useClass: impl };
}

@Module({})
export class DreamsModule {
  static register(options?: DreamsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: DreamsModule,
      providers: [adapterProvider(kind), DreamsService],
      exports: [DreamsService, DREAMS_PORT],
    };
  }
}
