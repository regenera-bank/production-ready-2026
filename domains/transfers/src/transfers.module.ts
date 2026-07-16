import { DynamicModule, Module, Provider } from '@nestjs/common';
import { TransfersProductionAdapter } from './adapters/production/transfers-production.adapter';
import { TransfersSandboxAdapter } from './adapters/sandbox/transfers-sandbox.adapter';
import { TransfersSimulatorAdapter } from './adapters/simulator/transfers-simulator.adapter';
import { TRANSFERS_PORT, TransfersAdapterKind } from './ports/transfers.port';
import { TransfersService } from './transfers.service';

export interface TransfersModuleOptions {
  adapter?: TransfersAdapterKind;
}

function resolveAdapter(options?: TransfersModuleOptions): TransfersAdapterKind {
  const fromEnv = process.env.TRANSFERS_ADAPTER as TransfersAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: TransfersAdapterKind): Provider {
  const map = {
    simulator: TransfersSimulatorAdapter,
    sandbox: TransfersSandboxAdapter,
    production: TransfersProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: TRANSFERS_PORT, useClass: impl };
}

@Module({})
export class TransfersModule {
  static register(options?: TransfersModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: TransfersModule,
      providers: [adapterProvider(kind), TransfersService],
      exports: [TransfersService, TRANSFERS_PORT],
    };
  }
}
