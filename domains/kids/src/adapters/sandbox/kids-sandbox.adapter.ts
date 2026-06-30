import { Injectable } from '@nestjs/common';
import {
  KidsAdapterKind,
  KidsCommand,
  KidsHealth,
  KidsPort,
  KidsResult,
} from '../../ports/kids.port';

@Injectable()
export class KidsSandboxAdapter implements KidsPort {
  readonly kind: KidsAdapterKind = 'sandbox';
  private readonly store = new Map<string, KidsResult>();

  async health(): Promise<KidsHealth> {
    return { ok: true, domain: 'kids', adapter: 'sandbox' };
  }

  async execute(command: KidsCommand): Promise<KidsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: KidsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
