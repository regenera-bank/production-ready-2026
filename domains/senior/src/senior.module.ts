import { DynamicModule, Module, Provider } from '@nestjs/common';
import { SeniorProductionAdapter } from './adapters/production/senior-production.adapter';
import { SeniorSandboxAdapter } from './adapters/sandbox/senior-sandbox.adapter';
import { SeniorSimulatorAdapter } from './adapters/simulator/senior-simulator.adapter';
import { SENIOR_PORT, SeniorAdapterKind } from './ports/senior.port';
import { SeniorService } from './senior.service';

export interface SeniorModuleOptions {
  adapter?: SeniorAdapterKind;
}

function resolveAdapter(options?: SeniorModuleOptions): SeniorAdapterKind {
  const fromEnv = process.env.SENIOR_ADAPTER as SeniorAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: SeniorAdapterKind): Provider {
  const map = {
    simulator: SeniorSimulatorAdapter,
    sandbox: SeniorSandboxAdapter,
    production: SeniorProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: SENIOR_PORT, useClass: impl };
}

@Module({})
export class SeniorModule {
  static register(options?: SeniorModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: SeniorModule,
      providers: [adapterProvider(kind), SeniorService],
      exports: [SeniorService, SENIOR_PORT],
    };
  }
}
