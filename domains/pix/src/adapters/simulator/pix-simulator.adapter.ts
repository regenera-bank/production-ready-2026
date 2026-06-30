import { Injectable } from '@nestjs/common';
import {
  PixAdapterKind,
  PixCommand,
  PixHealth,
  PixPort,
  PixResult,
} from '../../ports/pix.port';

@Injectable()
export class PixSimulatorAdapter implements PixPort {
  readonly kind: PixAdapterKind = 'simulator';
  private readonly ledger = new Map<string, PixResult>();

  async health(): Promise<PixHealth> {
    return { ok: true, domain: 'pix', adapter: 'simulator' };
  }

  async execute(command: PixCommand): Promise<PixResult> {
    // Contract mirrors @regenera/core-bank; simulator stays local for CI.
    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: PixResult = {
      referenceId: `sim-pix-${command.idempotencyKey}`,
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
