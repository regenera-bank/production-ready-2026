import { DynamicModule, Module, Provider } from '@nestjs/common';
import { PaymentsProductionAdapter } from './adapters/production/payments-production.adapter';
import { PaymentsSandboxAdapter } from './adapters/sandbox/payments-sandbox.adapter';
import { PaymentsSimulatorAdapter } from './adapters/simulator/payments-simulator.adapter';
import { PAYMENTS_PORT, PaymentsAdapterKind } from './ports/payments.port';
import { PaymentsService } from './payments.service';

export interface PaymentsModuleOptions {
  adapter?: PaymentsAdapterKind;
}

function resolveAdapter(options?: PaymentsModuleOptions): PaymentsAdapterKind {
  const fromEnv = process.env.PAYMENTS_ADAPTER as PaymentsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: PaymentsAdapterKind): Provider {
  const map = {
    simulator: PaymentsSimulatorAdapter,
    sandbox: PaymentsSandboxAdapter,
    production: PaymentsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: PAYMENTS_PORT, useClass: impl };
}

@Module({})
export class PaymentsModule {
  static register(options?: PaymentsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: PaymentsModule,
      providers: [adapterProvider(kind), PaymentsService],
      exports: [PaymentsService, PAYMENTS_PORT],
    };
  }
}
