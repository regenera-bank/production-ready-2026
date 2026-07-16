import { DynamicModule, Module, Provider } from '@nestjs/common';
import { DevicesProductionAdapter } from './adapters/production/devices-production.adapter';
import { DevicesSandboxAdapter } from './adapters/sandbox/devices-sandbox.adapter';
import { DevicesSimulatorAdapter } from './adapters/simulator/devices-simulator.adapter';
import { DEVICES_PORT, DevicesAdapterKind } from './ports/devices.port';
import { DevicesService } from './devices.service';

export interface DevicesModuleOptions {
  adapter?: DevicesAdapterKind;
}

function resolveAdapter(options?: DevicesModuleOptions): DevicesAdapterKind {
  const fromEnv = process.env.DEVICES_ADAPTER as DevicesAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: DevicesAdapterKind): Provider {
  const map = {
    simulator: DevicesSimulatorAdapter,
    sandbox: DevicesSandboxAdapter,
    production: DevicesProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: DEVICES_PORT, useClass: impl };
}

@Module({})
export class DevicesModule {
  static register(options?: DevicesModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: DevicesModule,
      providers: [adapterProvider(kind), DevicesService],
      exports: [DevicesService, DEVICES_PORT],
    };
  }
}
