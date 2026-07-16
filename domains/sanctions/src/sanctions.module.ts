import { DynamicModule, Module, Provider } from '@nestjs/common';
import { SanctionsProductionAdapter } from './adapters/production/sanctions-production.adapter';
import { SanctionsSandboxAdapter } from './adapters/sandbox/sanctions-sandbox.adapter';
import { SanctionsSimulatorAdapter } from './adapters/simulator/sanctions-simulator.adapter';
import { SANCTIONS_PORT, SanctionsAdapterKind } from './ports/sanctions.port';
import { SanctionsService } from './sanctions.service';

export interface SanctionsModuleOptions {
  adapter?: SanctionsAdapterKind;
}

function resolveAdapter(options?: SanctionsModuleOptions): SanctionsAdapterKind {
  const fromEnv = process.env.SANCTIONS_ADAPTER as SanctionsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: SanctionsAdapterKind): Provider {
  const map = {
    simulator: SanctionsSimulatorAdapter,
    sandbox: SanctionsSandboxAdapter,
    production: SanctionsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: SANCTIONS_PORT, useClass: impl };
}

@Module({})
export class SanctionsModule {
  static register(options?: SanctionsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: SanctionsModule,
      providers: [adapterProvider(kind), SanctionsService],
      exports: [SanctionsService, SANCTIONS_PORT],
    };
  }
}
