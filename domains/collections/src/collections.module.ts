import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CollectionsProductionAdapter } from './adapters/production/collections-production.adapter';
import { CollectionsSandboxAdapter } from './adapters/sandbox/collections-sandbox.adapter';
import { CollectionsSimulatorAdapter } from './adapters/simulator/collections-simulator.adapter';
import { COLLECTIONS_PORT, CollectionsAdapterKind } from './ports/collections.port';
import { CollectionsService } from './collections.service';

export interface CollectionsModuleOptions {
  adapter?: CollectionsAdapterKind;
}

function resolveAdapter(options?: CollectionsModuleOptions): CollectionsAdapterKind {
  const fromEnv = process.env.COLLECTIONS_ADAPTER as CollectionsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: CollectionsAdapterKind): Provider {
  const map = {
    simulator: CollectionsSimulatorAdapter,
    sandbox: CollectionsSandboxAdapter,
    production: CollectionsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: COLLECTIONS_PORT, useClass: impl };
}

@Module({})
export class CollectionsModule {
  static register(options?: CollectionsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: CollectionsModule,
      providers: [adapterProvider(kind), CollectionsService],
      exports: [CollectionsService, COLLECTIONS_PORT],
    };
  }
}
