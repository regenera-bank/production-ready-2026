import { DynamicModule, Module, Provider } from '@nestjs/common';
import { KidsProductionAdapter } from './adapters/production/kids-production.adapter';
import { KidsSandboxAdapter } from './adapters/sandbox/kids-sandbox.adapter';
import { KidsSimulatorAdapter } from './adapters/simulator/kids-simulator.adapter';
import { KIDS_PORT, KidsAdapterKind } from './ports/kids.port';
import { KidsService } from './kids.service';

export interface KidsModuleOptions {
  adapter?: KidsAdapterKind;
}

function resolveAdapter(options?: KidsModuleOptions): KidsAdapterKind {
  const fromEnv = process.env.KIDS_ADAPTER as KidsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: KidsAdapterKind): Provider {
  const map = {
    simulator: KidsSimulatorAdapter,
    sandbox: KidsSandboxAdapter,
    production: KidsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: KIDS_PORT, useClass: impl };
}

@Module({})
export class KidsModule {
  static register(options?: KidsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: KidsModule,
      providers: [adapterProvider(kind), KidsService],
      exports: [KidsService, KIDS_PORT],
    };
  }
}
