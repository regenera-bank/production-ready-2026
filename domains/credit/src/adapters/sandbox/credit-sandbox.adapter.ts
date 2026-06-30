import { Injectable } from '@nestjs/common';
import {
  CreditAdapterKind,
  CreditCommand,
  CreditHealth,
  CreditPort,
  CreditResult,
} from '../../ports/credit.port';

@Injectable()
export class CreditSandboxAdapter implements CreditPort {
  readonly kind: CreditAdapterKind = 'sandbox';
  private readonly store = new Map<string, CreditResult>();

  async health(): Promise<CreditHealth> {
    return { ok: true, domain: 'credit', adapter: 'sandbox' };
  }

  async execute(command: CreditCommand): Promise<CreditResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: CreditResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
