import { Injectable } from '@nestjs/common';
import {
  ReconciliationAdapterKind,
  ReconciliationCommand,
  ReconciliationHealth,
  ReconciliationPort,
  ReconciliationResult,
} from '../../ports/reconciliation.port';

@Injectable()
export class ReconciliationSandboxAdapter implements ReconciliationPort {
  readonly kind: ReconciliationAdapterKind = 'sandbox';
  private readonly store = new Map<string, ReconciliationResult>();

  async health(): Promise<ReconciliationHealth> {
    return { ok: true, domain: 'reconciliation', adapter: 'sandbox' };
  }

  async execute(command: ReconciliationCommand): Promise<ReconciliationResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: ReconciliationResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
