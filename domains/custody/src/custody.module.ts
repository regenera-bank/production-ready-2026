import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CustodyProductionAdapter } from './adapters/production/custody-production.adapter';
import { CustodySandboxAdapter } from './adapters/sandbox/custody-sandbox.adapter';
import { CustodySimulatorAdapter } from './adapters/simulator/custody-simulator.adapter';
import { CUSTODY_PORT, CustodyAdapterKind } from './ports/custody.port';
import { CustodyService } from './custody.service';

export interface CustodyModuleOptions {
  adapter?: CustodyAdapterKind;
}

function resolveAdapter(options?: CustodyModuleOptions): CustodyAdapterKind {
  const fromEnv = process.env.CUSTODY_ADAPTER as CustodyAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: CustodyAdapterKind): Provider {
  const map = {
    simulator: CustodySimulatorAdapter,
    sandbox: CustodySandboxAdapter,
    production: CustodyProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: CUSTODY_PORT, useClass: impl };
}

@Module({})
export class CustodyModule {
  static register(options?: CustodyModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: CustodyModule,
      providers: [adapterProvider(kind), CustodyService],
      exports: [CustodyService, CUSTODY_PORT],
    };
  }
}
