import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AccountsProductionAdapter } from './adapters/production/accounts-production.adapter';
import { AccountsSandboxAdapter } from './adapters/sandbox/accounts-sandbox.adapter';
import { AccountsSimulatorAdapter } from './adapters/simulator/accounts-simulator.adapter';
import { ACCOUNTS_PORT, AccountsAdapterKind } from './ports/accounts.port';
import { AccountsService } from './accounts.service';

export interface AccountsModuleOptions {
  adapter?: AccountsAdapterKind;
}

function resolveAdapter(options?: AccountsModuleOptions): AccountsAdapterKind {
  const fromEnv = process.env.ACCOUNTS_ADAPTER as AccountsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: AccountsAdapterKind): Provider {
  const map = {
    simulator: AccountsSimulatorAdapter,
    sandbox: AccountsSandboxAdapter,
    production: AccountsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: ACCOUNTS_PORT, useClass: impl };
}

@Module({})
export class AccountsModule {
  static register(options?: AccountsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: AccountsModule,
      providers: [adapterProvider(kind), AccountsService],
      exports: [AccountsService, ACCOUNTS_PORT],
    };
  }
}
