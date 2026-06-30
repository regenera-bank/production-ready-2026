import { DynamicModule, Module, Provider } from '@nestjs/common';
import { KycProductionAdapter } from './adapters/production/kyc-production.adapter';
import { KycSandboxAdapter } from './adapters/sandbox/kyc-sandbox.adapter';
import { KycSimulatorAdapter } from './adapters/simulator/kyc-simulator.adapter';
import { KYC_PORT, KycAdapterKind } from './ports/kyc.port';
import { KycService } from './kyc.service';

export interface KycModuleOptions {
  adapter?: KycAdapterKind;
}

function resolveAdapter(options?: KycModuleOptions): KycAdapterKind {
  const fromEnv = process.env.KYC_ADAPTER as KycAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: KycAdapterKind): Provider {
  const map = {
    simulator: KycSimulatorAdapter,
    sandbox: KycSandboxAdapter,
    production: KycProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: KYC_PORT, useClass: impl };
}

@Module({})
export class KycModule {
  static register(options?: KycModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: KycModule,
      providers: [adapterProvider(kind), KycService],
      exports: [KycService, KYC_PORT],
    };
  }
}
