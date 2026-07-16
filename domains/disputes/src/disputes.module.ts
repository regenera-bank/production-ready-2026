import { DynamicModule, Module, Provider } from '@nestjs/common';
import { DisputesProductionAdapter } from './adapters/production/disputes-production.adapter';
import { DisputesSandboxAdapter } from './adapters/sandbox/disputes-sandbox.adapter';
import { DisputesSimulatorAdapter } from './adapters/simulator/disputes-simulator.adapter';
import { DISPUTES_PORT, DisputesAdapterKind } from './ports/disputes.port';
import { DisputesService } from './disputes.service';

export interface DisputesModuleOptions {
  adapter?: DisputesAdapterKind;
}

function resolveAdapter(options?: DisputesModuleOptions): DisputesAdapterKind {
  const fromEnv = process.env.DISPUTES_ADAPTER as DisputesAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: DisputesAdapterKind): Provider {
  const map = {
    simulator: DisputesSimulatorAdapter,
    sandbox: DisputesSandboxAdapter,
    production: DisputesProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: DISPUTES_PORT, useClass: impl };
}

@Module({})
export class DisputesModule {
  static register(options?: DisputesModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: DisputesModule,
      providers: [adapterProvider(kind), DisputesService],
      exports: [DisputesService, DISPUTES_PORT],
    };
  }
}
