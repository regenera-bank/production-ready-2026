import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CardInvoicesProductionAdapter } from './adapters/production/card-invoices-production.adapter';
import { CardInvoicesSandboxAdapter } from './adapters/sandbox/card-invoices-sandbox.adapter';
import { CardInvoicesSimulatorAdapter } from './adapters/simulator/card-invoices-simulator.adapter';
import { CARD_INVOICES_PORT, CardInvoicesAdapterKind } from './ports/card-invoices.port';
import { CardInvoicesService } from './card-invoices.service';

export interface CardInvoicesModuleOptions {
  adapter?: CardInvoicesAdapterKind;
}

function resolveAdapter(options?: CardInvoicesModuleOptions): CardInvoicesAdapterKind {
  const fromEnv = process.env.CARD_INVOICES_ADAPTER as CardInvoicesAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: CardInvoicesAdapterKind): Provider {
  const map = {
    simulator: CardInvoicesSimulatorAdapter,
    sandbox: CardInvoicesSandboxAdapter,
    production: CardInvoicesProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: CARD_INVOICES_PORT, useClass: impl };
}

@Module({})
export class CardInvoicesModule {
  static register(options?: CardInvoicesModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: CardInvoicesModule,
      providers: [adapterProvider(kind), CardInvoicesService],
      exports: [CardInvoicesService, CARD_INVOICES_PORT],
    };
  }
}
