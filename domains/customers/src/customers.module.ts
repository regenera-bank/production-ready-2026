import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CustomersProductionAdapter } from './adapters/production/customers-production.adapter';
import { CustomersSandboxAdapter } from './adapters/sandbox/customers-sandbox.adapter';
import { CustomersSimulatorAdapter } from './adapters/simulator/customers-simulator.adapter';
import { CUSTOMERS_PORT, CustomersAdapterKind } from './ports/customers.port';
import { CustomersService } from './customers.service';

export interface CustomersModuleOptions {
  adapter?: CustomersAdapterKind;
}

function resolveAdapter(options?: CustomersModuleOptions): CustomersAdapterKind {
  const fromEnv = process.env.CUSTOMERS_ADAPTER as CustomersAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: CustomersAdapterKind): Provider {
  const map = {
    simulator: CustomersSimulatorAdapter,
    sandbox: CustomersSandboxAdapter,
    production: CustomersProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: CUSTOMERS_PORT, useClass: impl };
}

@Module({})
export class CustomersModule {
  static register(options?: CustomersModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: CustomersModule,
      providers: [adapterProvider(kind), CustomersService],
      exports: [CustomersService, CUSTOMERS_PORT],
    };
  }
}
