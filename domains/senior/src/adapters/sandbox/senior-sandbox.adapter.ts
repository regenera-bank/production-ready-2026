import { Injectable } from '@nestjs/common';
import {
  SeniorAdapterKind,
  SeniorCommand,
  SeniorHealth,
  SeniorPort,
  SeniorResult,
} from '../../ports/senior.port';

@Injectable()
export class SeniorSandboxAdapter implements SeniorPort {
  readonly kind: SeniorAdapterKind = 'sandbox';
  private readonly store = new Map<string, SeniorResult>();

  async health(): Promise<SeniorHealth> {
    return { ok: true, domain: 'senior', adapter: 'sandbox' };
  }

  async execute(command: SeniorCommand): Promise<SeniorResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: SeniorResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
