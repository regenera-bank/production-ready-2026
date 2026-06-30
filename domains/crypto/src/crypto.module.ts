import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CryptoProductionAdapter } from './adapters/production/crypto-production.adapter';
import { CryptoSandboxAdapter } from './adapters/sandbox/crypto-sandbox.adapter';
import { CryptoSimulatorAdapter } from './adapters/simulator/crypto-simulator.adapter';
import { CRYPTO_PORT, CryptoAdapterKind } from './ports/crypto.port';
import { CryptoService } from './crypto.service';

export interface CryptoModuleOptions {
  adapter?: CryptoAdapterKind;
}

function resolveAdapter(options?: CryptoModuleOptions): CryptoAdapterKind {
  const fromEnv = process.env.CRYPTO_ADAPTER as CryptoAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: CryptoAdapterKind): Provider {
  const map = {
    simulator: CryptoSimulatorAdapter,
    sandbox: CryptoSandboxAdapter,
    production: CryptoProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: CRYPTO_PORT, useClass: impl };
}

@Module({})
export class CryptoModule {
  static register(options?: CryptoModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: CryptoModule,
      providers: [adapterProvider(kind), CryptoService],
      exports: [CryptoService, CRYPTO_PORT],
    };
  }
}
