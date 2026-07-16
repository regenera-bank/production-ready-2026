import { Injectable } from '@nestjs/common';
import {
  LedgerAdapterKind,
  LedgerCommand,
  LedgerHealth,
  LedgerPort,
  LedgerResult,
} from '../../ports/ledger.port';

@Injectable()
export class LedgerSandboxAdapter implements LedgerPort {
  readonly kind: LedgerAdapterKind = 'sandbox';
  private readonly store = new Map<string, LedgerResult>();

  async health(): Promise<LedgerHealth> {
    return { ok: true, domain: 'ledger', adapter: 'sandbox' };
  }

  async execute(command: LedgerCommand): Promise<LedgerResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: LedgerResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
