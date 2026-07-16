import { DynamicModule, Module, Provider } from '@nestjs/common';
import { PetsProductionAdapter } from './adapters/production/pets-production.adapter';
import { PetsSandboxAdapter } from './adapters/sandbox/pets-sandbox.adapter';
import { PetsSimulatorAdapter } from './adapters/simulator/pets-simulator.adapter';
import { PETS_PORT, PetsAdapterKind } from './ports/pets.port';
import { PetsService } from './pets.service';

export interface PetsModuleOptions {
  adapter?: PetsAdapterKind;
}

function resolveAdapter(options?: PetsModuleOptions): PetsAdapterKind {
  const fromEnv = process.env.PETS_ADAPTER as PetsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: PetsAdapterKind): Provider {
  const map = {
    simulator: PetsSimulatorAdapter,
    sandbox: PetsSandboxAdapter,
    production: PetsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: PETS_PORT, useClass: impl };
}

@Module({})
export class PetsModule {
  static register(options?: PetsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: PetsModule,
      providers: [adapterProvider(kind), PetsService],
      exports: [PetsService, PETS_PORT],
    };
  }
}
