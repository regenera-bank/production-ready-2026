import { Inject, Injectable } from '@nestjs/common';
import { DEVICES_PORT, DevicesCommand, DevicesPort, DevicesResult } from './ports/devices.port';

@Injectable()
export class DevicesService {
  constructor(@Inject(DEVICES_PORT) private readonly port: DevicesPort) {}

  health() {
    return this.port.health();
  }

  execute(command: DevicesCommand): Promise<DevicesResult> {
    return this.port.execute(command);
  }
}
