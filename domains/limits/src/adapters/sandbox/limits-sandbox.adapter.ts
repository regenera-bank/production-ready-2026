import { Injectable } from '@nestjs/common';
import {
  LimitsAdapterKind,
  LimitsCommand,
  LimitsHealth,
  LimitsPort,
  LimitsResult,
} from '../../ports/limits.port';

@Injectable()
export class LimitsSandboxAdapter implements LimitsPort {
  readonly kind: LimitsAdapterKind = 'sandbox';
  private readonly store = new Map<string, LimitsResult>();

  async health(): Promise<LimitsHealth> {
    return { ok: true, domain: 'limits', adapter: 'sandbox' };
  }

  async execute(command: LimitsCommand): Promise<LimitsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: LimitsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
