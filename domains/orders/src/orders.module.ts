import { DynamicModule, Module, Provider } from '@nestjs/common';
import { OrdersProductionAdapter } from './adapters/production/orders-production.adapter';
import { OrdersSandboxAdapter } from './adapters/sandbox/orders-sandbox.adapter';
import { OrdersSimulatorAdapter } from './adapters/simulator/orders-simulator.adapter';
import { ORDERS_PORT, OrdersAdapterKind } from './ports/orders.port';
import { OrdersService } from './orders.service';

export interface OrdersModuleOptions {
  adapter?: OrdersAdapterKind;
}

function resolveAdapter(options?: OrdersModuleOptions): OrdersAdapterKind {
  const fromEnv = process.env.ORDERS_ADAPTER as OrdersAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: OrdersAdapterKind): Provider {
  const map = {
    simulator: OrdersSimulatorAdapter,
    sandbox: OrdersSandboxAdapter,
    production: OrdersProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: ORDERS_PORT, useClass: impl };
}

@Module({})
export class OrdersModule {
  static register(options?: OrdersModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: OrdersModule,
      providers: [adapterProvider(kind), OrdersService],
      exports: [OrdersService, ORDERS_PORT],
    };
  }
}
