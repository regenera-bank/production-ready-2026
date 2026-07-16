import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ProtectionProductionAdapter } from './adapters/production/protection-production.adapter';
import { ProtectionSandboxAdapter } from './adapters/sandbox/protection-sandbox.adapter';
import { ProtectionSimulatorAdapter } from './adapters/simulator/protection-simulator.adapter';
import { PROTECTION_PORT, ProtectionAdapterKind } from './ports/protection.port';
import { ProtectionService } from './protection.service';

export interface ProtectionModuleOptions {
  adapter?: ProtectionAdapterKind;
}

function resolveAdapter(options?: ProtectionModuleOptions): ProtectionAdapterKind {
  const fromEnv = process.env.PROTECTION_ADAPTER as ProtectionAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: ProtectionAdapterKind): Provider {
  const map = {
    simulator: ProtectionSimulatorAdapter,
    sandbox: ProtectionSandboxAdapter,
    production: ProtectionProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: PROTECTION_PORT, useClass: impl };
}

@Module({})
export class ProtectionModule {
  static register(options?: ProtectionModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: ProtectionModule,
      providers: [adapterProvider(kind), ProtectionService],
      exports: [ProtectionService, PROTECTION_PORT],
    };
  }
}
