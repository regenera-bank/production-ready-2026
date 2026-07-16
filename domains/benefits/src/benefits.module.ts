import { DynamicModule, Module, Provider } from '@nestjs/common';
import { BenefitsProductionAdapter } from './adapters/production/benefits-production.adapter';
import { BenefitsSandboxAdapter } from './adapters/sandbox/benefits-sandbox.adapter';
import { BenefitsSimulatorAdapter } from './adapters/simulator/benefits-simulator.adapter';
import { BENEFITS_PORT, BenefitsAdapterKind } from './ports/benefits.port';
import { BenefitsService } from './benefits.service';

export interface BenefitsModuleOptions {
  adapter?: BenefitsAdapterKind;
}

function resolveAdapter(options?: BenefitsModuleOptions): BenefitsAdapterKind {
  const fromEnv = process.env.BENEFITS_ADAPTER as BenefitsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: BenefitsAdapterKind): Provider {
  const map = {
    simulator: BenefitsSimulatorAdapter,
    sandbox: BenefitsSandboxAdapter,
    production: BenefitsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: BENEFITS_PORT, useClass: impl };
}

@Module({})
export class BenefitsModule {
  static register(options?: BenefitsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: BenefitsModule,
      providers: [adapterProvider(kind), BenefitsService],
      exports: [BenefitsService, BENEFITS_PORT],
    };
  }
}
