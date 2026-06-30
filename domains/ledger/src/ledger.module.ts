import { DynamicModule, Module, Provider } from '@nestjs/common';
import { LedgerProductionAdapter } from './adapters/production/ledger-production.adapter';
import { LedgerSandboxAdapter } from './adapters/sandbox/ledger-sandbox.adapter';
import { LedgerSimulatorAdapter } from './adapters/simulator/ledger-simulator.adapter';
import { LEDGER_PORT, LedgerAdapterKind } from './ports/ledger.port';
import { LedgerService } from './ledger.service';

export interface LedgerModuleOptions {
  adapter?: LedgerAdapterKind;
}

function resolveAdapter(options?: LedgerModuleOptions): LedgerAdapterKind {
  const fromEnv = process.env.LEDGER_ADAPTER as LedgerAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: LedgerAdapterKind): Provider {
  const map = {
    simulator: LedgerSimulatorAdapter,
    sandbox: LedgerSandboxAdapter,
    production: LedgerProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: LEDGER_PORT, useClass: impl };
}

@Module({})
export class LedgerModule {
  static register(options?: LedgerModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: LedgerModule,
      providers: [adapterProvider(kind), LedgerService],
      exports: [LedgerService, LEDGER_PORT],
    };
  }
}
