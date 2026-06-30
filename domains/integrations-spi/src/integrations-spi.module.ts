import { DynamicModule, Module, Provider } from '@nestjs/common';
import { SpiProductionAdapter } from './adapters/production/spi-production.adapter';
import { SpiSandboxAdapter } from './adapters/sandbox/spi-sandbox.adapter';
import { SpiSimulatorAdapter } from './adapters/simulator/spi-simulator.adapter';
import { DictProductionAdapter } from './adapters/production/dict-production.adapter';
import { DictSandboxAdapter } from './adapters/sandbox/dict-sandbox.adapter';
import { DictSimulatorAdapter } from './adapters/simulator/dict-simulator.adapter';
import { SPI_PORT, SpiAdapterKind } from './ports/spi.port';
import { DICT_PORT, DictAdapterKind } from './ports/dict.port';
import { IntegrationsSpiService } from './integrations-spi.service';

export interface IntegrationsSpiModuleOptions {
  spiAdapter?: SpiAdapterKind;
  dictAdapter?: DictAdapterKind;
}

function spiProvider(kind: SpiAdapterKind): Provider {
  const map = {
    simulator: SpiSimulatorAdapter,
    sandbox: SpiSandboxAdapter,
    production: SpiProductionAdapter,
  } as const;
  return { provide: SPI_PORT, useClass: map[kind] };
}

function dictProvider(kind: DictAdapterKind): Provider {
  const map = {
    simulator: DictSimulatorAdapter,
    sandbox: DictSandboxAdapter,
    production: DictProductionAdapter,
  } as const;
  return { provide: DICT_PORT, useClass: map[kind] };
}

@Module({})
export class IntegrationsSpiModule {
  static register(options?: IntegrationsSpiModuleOptions): DynamicModule {
    const spiKind =
      options?.spiAdapter ??
      (process.env.INTEGRATIONS_SPI_ADAPTER as SpiAdapterKind | undefined) ??
      'simulator';
    const dictKind =
      options?.dictAdapter ??
      (process.env.INTEGRATIONS_DICT_ADAPTER as DictAdapterKind | undefined) ??
      'simulator';

    return {
      module: IntegrationsSpiModule,
      providers: [spiProvider(spiKind), dictProvider(dictKind), IntegrationsSpiService],
      exports: [IntegrationsSpiService, SPI_PORT, DICT_PORT],
    };
  }
}
