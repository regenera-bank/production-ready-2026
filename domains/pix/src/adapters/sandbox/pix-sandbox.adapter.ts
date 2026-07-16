import { Injectable } from '@nestjs/common';
import {
  PixAdapterKind,
  PixCommand,
  PixHealth,
  PixPort,
  PixResult,
} from '../../ports/pix.port';

@Injectable()
export class PixSandboxAdapter implements PixPort {
  readonly kind: PixAdapterKind = 'sandbox';
  private readonly store = new Map<string, PixResult>();

  async health(): Promise<PixHealth> {
    return { ok: true, domain: 'pix', adapter: 'sandbox' };
  }

  async execute(command: PixCommand): Promise<PixResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: PixResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
