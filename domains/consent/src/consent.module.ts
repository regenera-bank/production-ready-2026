import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConsentProductionAdapter } from './adapters/production/consent-production.adapter';
import { ConsentSandboxAdapter } from './adapters/sandbox/consent-sandbox.adapter';
import { ConsentSimulatorAdapter } from './adapters/simulator/consent-simulator.adapter';
import { CONSENT_PORT, ConsentAdapterKind } from './ports/consent.port';
import { ConsentService } from './consent.service';

export interface ConsentModuleOptions {
  adapter?: ConsentAdapterKind;
}

function resolveAdapter(options?: ConsentModuleOptions): ConsentAdapterKind {
  const fromEnv = process.env.CONSENT_ADAPTER as ConsentAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: ConsentAdapterKind): Provider {
  const map = {
    simulator: ConsentSimulatorAdapter,
    sandbox: ConsentSandboxAdapter,
    production: ConsentProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: CONSENT_PORT, useClass: impl };
}

@Module({})
export class ConsentModule {
  static register(options?: ConsentModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: ConsentModule,
      providers: [adapterProvider(kind), ConsentService],
      exports: [ConsentService, CONSENT_PORT],
    };
  }
}
