import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ReconciliationProductionAdapter } from './adapters/production/reconciliation-production.adapter';
import { ReconciliationSandboxAdapter } from './adapters/sandbox/reconciliation-sandbox.adapter';
import { ReconciliationSimulatorAdapter } from './adapters/simulator/reconciliation-simulator.adapter';
import { RECONCILIATION_PORT, ReconciliationAdapterKind } from './ports/reconciliation.port';
import { ReconciliationService } from './reconciliation.service';

export interface ReconciliationModuleOptions {
  adapter?: ReconciliationAdapterKind;
}

function resolveAdapter(options?: ReconciliationModuleOptions): ReconciliationAdapterKind {
  const fromEnv = process.env.RECONCILIATION_ADAPTER as ReconciliationAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: ReconciliationAdapterKind): Provider {
  const map = {
    simulator: ReconciliationSimulatorAdapter,
    sandbox: ReconciliationSandboxAdapter,
    production: ReconciliationProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: RECONCILIATION_PORT, useClass: impl };
}

@Module({})
export class ReconciliationModule {
  static register(options?: ReconciliationModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: ReconciliationModule,
      providers: [adapterProvider(kind), ReconciliationService],
      exports: [ReconciliationService, RECONCILIATION_PORT],
    };
  }
}
