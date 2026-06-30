import { DynamicModule, Module, Provider } from '@nestjs/common';
import { SustainabilityProductionAdapter } from './adapters/production/sustainability-production.adapter';
import { SustainabilitySandboxAdapter } from './adapters/sandbox/sustainability-sandbox.adapter';
import { SustainabilitySimulatorAdapter } from './adapters/simulator/sustainability-simulator.adapter';
import { SUSTAINABILITY_PORT, SustainabilityAdapterKind } from './ports/sustainability.port';
import { SustainabilityService } from './sustainability.service';

export interface SustainabilityModuleOptions {
  adapter?: SustainabilityAdapterKind;
}

function resolveAdapter(options?: SustainabilityModuleOptions): SustainabilityAdapterKind {
  const fromEnv = process.env.SUSTAINABILITY_ADAPTER as SustainabilityAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: SustainabilityAdapterKind): Provider {
  const map = {
    simulator: SustainabilitySimulatorAdapter,
    sandbox: SustainabilitySandboxAdapter,
    production: SustainabilityProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: SUSTAINABILITY_PORT, useClass: impl };
}

@Module({})
export class SustainabilityModule {
  static register(options?: SustainabilityModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: SustainabilityModule,
      providers: [adapterProvider(kind), SustainabilityService],
      exports: [SustainabilityService, SUSTAINABILITY_PORT],
    };
  }
}
