import { Injectable } from '@nestjs/common';
import {
  TransactionsAdapterKind,
  TransactionsCommand,
  TransactionsHealth,
  TransactionsPort,
  TransactionsResult,
} from '../../ports/transactions.port';

@Injectable()
export class TransactionsSandboxAdapter implements TransactionsPort {
  readonly kind: TransactionsAdapterKind = 'sandbox';
  private readonly store = new Map<string, TransactionsResult>();

  async health(): Promise<TransactionsHealth> {
    return { ok: true, domain: 'transactions', adapter: 'sandbox' };
  }

  async execute(command: TransactionsCommand): Promise<TransactionsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: TransactionsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
