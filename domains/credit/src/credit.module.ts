import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CreditProductionAdapter } from './adapters/production/credit-production.adapter';
import { CreditSandboxAdapter } from './adapters/sandbox/credit-sandbox.adapter';
import { CreditSimulatorAdapter } from './adapters/simulator/credit-simulator.adapter';
import { CREDIT_PORT, CreditAdapterKind } from './ports/credit.port';
import { CreditService } from './credit.service';

export interface CreditModuleOptions {
  adapter?: CreditAdapterKind;
}

function resolveAdapter(options?: CreditModuleOptions): CreditAdapterKind {
  const fromEnv = process.env.CREDIT_ADAPTER as CreditAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: CreditAdapterKind): Provider {
  const map = {
    simulator: CreditSimulatorAdapter,
    sandbox: CreditSandboxAdapter,
    production: CreditProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: CREDIT_PORT, useClass: impl };
}

@Module({})
export class CreditModule {
  static register(options?: CreditModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: CreditModule,
      providers: [adapterProvider(kind), CreditService],
      exports: [CreditService, CREDIT_PORT],
    };
  }
}
