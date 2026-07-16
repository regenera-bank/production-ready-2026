import { DynamicModule, Module, Provider } from '@nestjs/common';
import { LimitsProductionAdapter } from './adapters/production/limits-production.adapter';
import { LimitsSandboxAdapter } from './adapters/sandbox/limits-sandbox.adapter';
import { LimitsSimulatorAdapter } from './adapters/simulator/limits-simulator.adapter';
import { LIMITS_PORT, LimitsAdapterKind } from './ports/limits.port';
import { LimitsService } from './limits.service';

export interface LimitsModuleOptions {
  adapter?: LimitsAdapterKind;
}

function resolveAdapter(options?: LimitsModuleOptions): LimitsAdapterKind {
  const fromEnv = process.env.LIMITS_ADAPTER as LimitsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: LimitsAdapterKind): Provider {
  const map = {
    simulator: LimitsSimulatorAdapter,
    sandbox: LimitsSandboxAdapter,
    production: LimitsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: LIMITS_PORT, useClass: impl };
}

@Module({})
export class LimitsModule {
  static register(options?: LimitsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: LimitsModule,
      providers: [adapterProvider(kind), LimitsService],
      exports: [LimitsService, LIMITS_PORT],
    };
  }
}
