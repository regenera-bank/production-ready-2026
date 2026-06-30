import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AmlProductionAdapter } from './adapters/production/aml-production.adapter';
import { AmlSandboxAdapter } from './adapters/sandbox/aml-sandbox.adapter';
import { AmlSimulatorAdapter } from './adapters/simulator/aml-simulator.adapter';
import { AML_PORT, AmlAdapterKind } from './ports/aml.port';
import { AmlService } from './aml.service';

export interface AmlModuleOptions {
  adapter?: AmlAdapterKind;
}

function resolveAdapter(options?: AmlModuleOptions): AmlAdapterKind {
  const fromEnv = process.env.AML_ADAPTER as AmlAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: AmlAdapterKind): Provider {
  const map = {
    simulator: AmlSimulatorAdapter,
    sandbox: AmlSandboxAdapter,
    production: AmlProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: AML_PORT, useClass: impl };
}

@Module({})
export class AmlModule {
  static register(options?: AmlModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: AmlModule,
      providers: [adapterProvider(kind), AmlService],
      exports: [AmlService, AML_PORT],
    };
  }
}
