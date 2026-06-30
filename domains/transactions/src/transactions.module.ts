import { DynamicModule, Module, Provider } from '@nestjs/common';
import { TransactionsProductionAdapter } from './adapters/production/transactions-production.adapter';
import { TransactionsSandboxAdapter } from './adapters/sandbox/transactions-sandbox.adapter';
import { TransactionsSimulatorAdapter } from './adapters/simulator/transactions-simulator.adapter';
import { TRANSACTIONS_PORT, TransactionsAdapterKind } from './ports/transactions.port';
import { TransactionsService } from './transactions.service';

export interface TransactionsModuleOptions {
  adapter?: TransactionsAdapterKind;
}

function resolveAdapter(options?: TransactionsModuleOptions): TransactionsAdapterKind {
  const fromEnv = process.env.TRANSACTIONS_ADAPTER as TransactionsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: TransactionsAdapterKind): Provider {
  const map = {
    simulator: TransactionsSimulatorAdapter,
    sandbox: TransactionsSandboxAdapter,
    production: TransactionsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: TRANSACTIONS_PORT, useClass: impl };
}

@Module({})
export class TransactionsModule {
  static register(options?: TransactionsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: TransactionsModule,
      providers: [adapterProvider(kind), TransactionsService],
      exports: [TransactionsService, TRANSACTIONS_PORT],
    };
  }
}
