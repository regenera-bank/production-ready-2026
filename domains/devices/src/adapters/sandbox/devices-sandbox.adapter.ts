import { Injectable } from '@nestjs/common';
import {
  DevicesAdapterKind,
  DevicesCommand,
  DevicesHealth,
  DevicesPort,
  DevicesResult,
} from '../../ports/devices.port';

@Injectable()
export class DevicesSandboxAdapter implements DevicesPort {
  readonly kind: DevicesAdapterKind = 'sandbox';
  private readonly store = new Map<string, DevicesResult>();

  async health(): Promise<DevicesHealth> {
    return { ok: true, domain: 'devices', adapter: 'sandbox' };
  }

  async execute(command: DevicesCommand): Promise<DevicesResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: DevicesResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
