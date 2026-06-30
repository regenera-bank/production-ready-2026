import { DynamicModule, Module, Provider } from '@nestjs/common';
import { FraudProductionAdapter } from './adapters/production/fraud-production.adapter';
import { FraudSandboxAdapter } from './adapters/sandbox/fraud-sandbox.adapter';
import { FraudSimulatorAdapter } from './adapters/simulator/fraud-simulator.adapter';
import { FRAUD_PORT, FraudAdapterKind } from './ports/fraud.port';
import { FraudService } from './fraud.service';

export interface FraudModuleOptions {
  adapter?: FraudAdapterKind;
}

function resolveAdapter(options?: FraudModuleOptions): FraudAdapterKind {
  const fromEnv = process.env.FRAUD_ADAPTER as FraudAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: FraudAdapterKind): Provider {
  const map = {
    simulator: FraudSimulatorAdapter,
    sandbox: FraudSandboxAdapter,
    production: FraudProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: FRAUD_PORT, useClass: impl };
}

@Module({})
export class FraudModule {
  static register(options?: FraudModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: FraudModule,
      providers: [adapterProvider(kind), FraudService],
      exports: [FraudService, FRAUD_PORT],
    };
  }
}
