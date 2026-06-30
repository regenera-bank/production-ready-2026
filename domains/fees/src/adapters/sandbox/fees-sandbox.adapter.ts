import { Injectable } from '@nestjs/common';
import {
  FeesAdapterKind,
  FeesCommand,
  FeesHealth,
  FeesPort,
  FeesResult,
} from '../../ports/fees.port';

@Injectable()
export class FeesSandboxAdapter implements FeesPort {
  readonly kind: FeesAdapterKind = 'sandbox';
  private readonly store = new Map<string, FeesResult>();

  async health(): Promise<FeesHealth> {
    return { ok: true, domain: 'fees', adapter: 'sandbox' };
  }

  async execute(command: FeesCommand): Promise<FeesResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: FeesResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
