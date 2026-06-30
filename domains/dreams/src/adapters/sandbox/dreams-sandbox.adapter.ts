import { Injectable } from '@nestjs/common';
import {
  DreamsAdapterKind,
  DreamsCommand,
  DreamsHealth,
  DreamsPort,
  DreamsResult,
} from '../../ports/dreams.port';

@Injectable()
export class DreamsSandboxAdapter implements DreamsPort {
  readonly kind: DreamsAdapterKind = 'sandbox';
  private readonly store = new Map<string, DreamsResult>();

  async health(): Promise<DreamsHealth> {
    return { ok: true, domain: 'dreams', adapter: 'sandbox' };
  }

  async execute(command: DreamsCommand): Promise<DreamsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: DreamsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
