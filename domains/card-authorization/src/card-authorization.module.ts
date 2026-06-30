import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CardAuthorizationProductionAdapter } from './adapters/production/card-authorization-production.adapter';
import { CardAuthorizationSandboxAdapter } from './adapters/sandbox/card-authorization-sandbox.adapter';
import { CardAuthorizationSimulatorAdapter } from './adapters/simulator/card-authorization-simulator.adapter';
import { CARD_AUTHORIZATION_PORT, CardAuthorizationAdapterKind } from './ports/card-authorization.port';
import { CardAuthorizationService } from './card-authorization.service';

export interface CardAuthorizationModuleOptions {
  adapter?: CardAuthorizationAdapterKind;
}

function resolveAdapter(options?: CardAuthorizationModuleOptions): CardAuthorizationAdapterKind {
  const fromEnv = process.env.CARD_AUTHORIZATION_ADAPTER as CardAuthorizationAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: CardAuthorizationAdapterKind): Provider {
  const map = {
    simulator: CardAuthorizationSimulatorAdapter,
    sandbox: CardAuthorizationSandboxAdapter,
    production: CardAuthorizationProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: CARD_AUTHORIZATION_PORT, useClass: impl };
}

@Module({})
export class CardAuthorizationModule {
  static register(options?: CardAuthorizationModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: CardAuthorizationModule,
      providers: [adapterProvider(kind), CardAuthorizationService],
      exports: [CardAuthorizationService, CARD_AUTHORIZATION_PORT],
    };
  }
}
