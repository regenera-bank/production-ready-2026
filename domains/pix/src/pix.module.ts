import { DynamicModule, Module, Provider } from '@nestjs/common';
import { PixProductionAdapter } from './adapters/production/pix-production.adapter';
import { PixSandboxAdapter } from './adapters/sandbox/pix-sandbox.adapter';
import { PixSimulatorAdapter } from './adapters/simulator/pix-simulator.adapter';
import { PIX_PORT, PixAdapterKind } from './ports/pix.port';
import { PixService } from './pix.service';

export interface PixModuleOptions {
  adapter?: PixAdapterKind;
}

function resolveAdapter(options?: PixModuleOptions): PixAdapterKind {
  const fromEnv = process.env.PIX_ADAPTER as PixAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: PixAdapterKind): Provider {
  const map = {
    simulator: PixSimulatorAdapter,
    sandbox: PixSandboxAdapter,
    production: PixProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: PIX_PORT, useClass: impl };
}

@Module({})
export class PixModule {
  static register(options?: PixModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: PixModule,
      providers: [adapterProvider(kind), PixService],
      exports: [PixService, PIX_PORT],
    };
  }
}
