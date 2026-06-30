import { DynamicModule, Module, Provider } from '@nestjs/common';
import { FeesProductionAdapter } from './adapters/production/fees-production.adapter';
import { FeesSandboxAdapter } from './adapters/sandbox/fees-sandbox.adapter';
import { FeesSimulatorAdapter } from './adapters/simulator/fees-simulator.adapter';
import { FEES_PORT, FeesAdapterKind } from './ports/fees.port';
import { FeesService } from './fees.service';

export interface FeesModuleOptions {
  adapter?: FeesAdapterKind;
}

function resolveAdapter(options?: FeesModuleOptions): FeesAdapterKind {
  const fromEnv = process.env.FEES_ADAPTER as FeesAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: FeesAdapterKind): Provider {
  const map = {
    simulator: FeesSimulatorAdapter,
    sandbox: FeesSandboxAdapter,
    production: FeesProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: FEES_PORT, useClass: impl };
}

@Module({})
export class FeesModule {
  static register(options?: FeesModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: FeesModule,
      providers: [adapterProvider(kind), FeesService],
      exports: [FeesService, FEES_PORT],
    };
  }
}
