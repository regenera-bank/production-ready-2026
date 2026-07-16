import { DynamicModule, Module, Provider } from '@nestjs/common';
import { IdentityProductionAdapter } from './adapters/production/identity-production.adapter';
import { IdentitySandboxAdapter } from './adapters/sandbox/identity-sandbox.adapter';
import { IdentitySimulatorAdapter } from './adapters/simulator/identity-simulator.adapter';
import { IDENTITY_PORT, IdentityAdapterKind } from './ports/identity.port';
import { IdentityService } from './identity.service';

export interface IdentityModuleOptions {
  adapter?: IdentityAdapterKind;
}

function resolveAdapter(options?: IdentityModuleOptions): IdentityAdapterKind {
  const fromEnv = process.env.IDENTITY_ADAPTER as IdentityAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: IdentityAdapterKind): Provider {
  const map = {
    simulator: IdentitySimulatorAdapter,
    sandbox: IdentitySandboxAdapter,
    production: IdentityProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: IDENTITY_PORT, useClass: impl };
}

@Module({})
export class IdentityModule {
  static register(options?: IdentityModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: IdentityModule,
      providers: [adapterProvider(kind), IdentityService],
      exports: [IdentityService, IDENTITY_PORT],
    };
  }
}
