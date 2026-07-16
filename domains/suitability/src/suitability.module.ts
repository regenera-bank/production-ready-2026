import { DynamicModule, Module, Provider } from '@nestjs/common';
import { SuitabilityProductionAdapter } from './adapters/production/suitability-production.adapter';
import { SuitabilitySandboxAdapter } from './adapters/sandbox/suitability-sandbox.adapter';
import { SuitabilitySimulatorAdapter } from './adapters/simulator/suitability-simulator.adapter';
import { SUITABILITY_PORT, SuitabilityAdapterKind } from './ports/suitability.port';
import { SuitabilityService } from './suitability.service';

export interface SuitabilityModuleOptions {
  adapter?: SuitabilityAdapterKind;
}

function resolveAdapter(options?: SuitabilityModuleOptions): SuitabilityAdapterKind {
  const fromEnv = process.env.SUITABILITY_ADAPTER as SuitabilityAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: SuitabilityAdapterKind): Provider {
  const map = {
    simulator: SuitabilitySimulatorAdapter,
    sandbox: SuitabilitySandboxAdapter,
    production: SuitabilityProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: SUITABILITY_PORT, useClass: impl };
}

@Module({})
export class SuitabilityModule {
  static register(options?: SuitabilityModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: SuitabilityModule,
      providers: [adapterProvider(kind), SuitabilityService],
      exports: [SuitabilityService, SUITABILITY_PORT],
    };
  }
}
