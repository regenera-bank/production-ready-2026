import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AcademyProductionAdapter } from './adapters/production/academy-production.adapter';
import { AcademySandboxAdapter } from './adapters/sandbox/academy-sandbox.adapter';
import { AcademySimulatorAdapter } from './adapters/simulator/academy-simulator.adapter';
import { ACADEMY_PORT, AcademyAdapterKind } from './ports/academy.port';
import { AcademyService } from './academy.service';

export interface AcademyModuleOptions {
  adapter?: AcademyAdapterKind;
}

function resolveAdapter(options?: AcademyModuleOptions): AcademyAdapterKind {
  const fromEnv = process.env.ACADEMY_ADAPTER as AcademyAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: AcademyAdapterKind): Provider {
  const map = {
    simulator: AcademySimulatorAdapter,
    sandbox: AcademySandboxAdapter,
    production: AcademyProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: ACADEMY_PORT, useClass: impl };
}

@Module({})
export class AcademyModule {
  static register(options?: AcademyModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: AcademyModule,
      providers: [adapterProvider(kind), AcademyService],
      exports: [AcademyService, ACADEMY_PORT],
    };
  }
}
