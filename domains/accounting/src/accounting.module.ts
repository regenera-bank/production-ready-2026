import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AccountingProductionAdapter } from './adapters/production/accounting-production.adapter';
import { AccountingSandboxAdapter } from './adapters/sandbox/accounting-sandbox.adapter';
import { AccountingSimulatorAdapter } from './adapters/simulator/accounting-simulator.adapter';
import { ACCOUNTING_PORT, AccountingAdapterKind } from './ports/accounting.port';
import { AccountingService } from './accounting.service';

export interface AccountingModuleOptions {
  adapter?: AccountingAdapterKind;
}

function resolveAdapter(options?: AccountingModuleOptions): AccountingAdapterKind {
  const fromEnv = process.env.ACCOUNTING_ADAPTER as AccountingAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: AccountingAdapterKind): Provider {
  const map = {
    simulator: AccountingSimulatorAdapter,
    sandbox: AccountingSandboxAdapter,
    production: AccountingProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: ACCOUNTING_PORT, useClass: impl };
}

@Module({})
export class AccountingModule {
  static register(options?: AccountingModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: AccountingModule,
      providers: [adapterProvider(kind), AccountingService],
      exports: [AccountingService, ACCOUNTING_PORT],
    };
  }
}
