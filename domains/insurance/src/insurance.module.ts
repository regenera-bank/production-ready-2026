import { DynamicModule, Module, Provider } from '@nestjs/common';
import { InsuranceProductionAdapter } from './adapters/production/insurance-production.adapter';
import { InsuranceSandboxAdapter } from './adapters/sandbox/insurance-sandbox.adapter';
import { InsuranceSimulatorAdapter } from './adapters/simulator/insurance-simulator.adapter';
import { INSURANCE_PORT, InsuranceAdapterKind } from './ports/insurance.port';
import { InsuranceService } from './insurance.service';

export interface InsuranceModuleOptions {
  adapter?: InsuranceAdapterKind;
}

function resolveAdapter(options?: InsuranceModuleOptions): InsuranceAdapterKind {
  const fromEnv = process.env.INSURANCE_ADAPTER as InsuranceAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: InsuranceAdapterKind): Provider {
  const map = {
    simulator: InsuranceSimulatorAdapter,
    sandbox: InsuranceSandboxAdapter,
    production: InsuranceProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: INSURANCE_PORT, useClass: impl };
}

@Module({})
export class InsuranceModule {
  static register(options?: InsuranceModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: InsuranceModule,
      providers: [adapterProvider(kind), InsuranceService],
      exports: [InsuranceService, INSURANCE_PORT],
    };
  }
}
