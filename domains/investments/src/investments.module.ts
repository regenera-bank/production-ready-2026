import { DynamicModule, Module, Provider } from '@nestjs/common';
import { InvestmentsProductionAdapter } from './adapters/production/investments-production.adapter';
import { InvestmentsSandboxAdapter } from './adapters/sandbox/investments-sandbox.adapter';
import { InvestmentsSimulatorAdapter } from './adapters/simulator/investments-simulator.adapter';
import { INVESTMENTS_PORT, InvestmentsAdapterKind } from './ports/investments.port';
import { InvestmentsService } from './investments.service';

export interface InvestmentsModuleOptions {
  adapter?: InvestmentsAdapterKind;
}

function resolveAdapter(options?: InvestmentsModuleOptions): InvestmentsAdapterKind {
  const fromEnv = process.env.INVESTMENTS_ADAPTER as InvestmentsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: InvestmentsAdapterKind): Provider {
  const map = {
    simulator: InvestmentsSimulatorAdapter,
    sandbox: InvestmentsSandboxAdapter,
    production: InvestmentsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: INVESTMENTS_PORT, useClass: impl };
}

@Module({})
export class InvestmentsModule {
  static register(options?: InvestmentsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: InvestmentsModule,
      providers: [adapterProvider(kind), InvestmentsService],
      exports: [InvestmentsService, INVESTMENTS_PORT],
    };
  }
}
