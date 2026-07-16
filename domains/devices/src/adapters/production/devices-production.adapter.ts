import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  DevicesAdapterKind,
  DevicesCommand,
  DevicesHealth,
  DevicesPort,
  DevicesResult,
} from '../../ports/devices.port';

@Injectable()
export class DevicesProductionAdapter implements DevicesPort {
  readonly kind: DevicesAdapterKind = 'production';

  async health(): Promise<DevicesHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('devices', 'production');
  }

  async execute(_command: DevicesCommand): Promise<DevicesResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('devices', 'production');
  }
}
