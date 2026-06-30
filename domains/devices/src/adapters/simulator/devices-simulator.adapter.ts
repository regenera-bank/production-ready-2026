import { Injectable } from '@nestjs/common';
import {
  DevicesAdapterKind,
  DevicesCommand,
  DevicesHealth,
  DevicesPort,
  DevicesResult,
} from '../../ports/devices.port';

@Injectable()
export class DevicesSimulatorAdapter implements DevicesPort {
  readonly kind: DevicesAdapterKind = 'simulator';
  private readonly ledger = new Map<string, DevicesResult>();

  async health(): Promise<DevicesHealth> {
    return { ok: true, domain: 'devices', adapter: 'simulator' };
  }

  async execute(command: DevicesCommand): Promise<DevicesResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: DevicesResult = {
      referenceId: `sim-devices-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: {
        simulated: true,
        principalId: command.principalId,
        payloadKeys: Object.keys(command.payload).sort(),
      },
    };
    this.ledger.set(command.idempotencyKey, result);
    return result;
  }
}
