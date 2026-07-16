import { Injectable } from '@nestjs/common';
import {
  TransactionsAdapterKind,
  TransactionsCommand,
  TransactionsHealth,
  TransactionsPort,
  TransactionsResult,
} from '../../ports/transactions.port';

@Injectable()
export class TransactionsSimulatorAdapter implements TransactionsPort {
  readonly kind: TransactionsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, TransactionsResult>();

  async health(): Promise<TransactionsHealth> {
    return { ok: true, domain: 'transactions', adapter: 'simulator' };
  }

  async execute(command: TransactionsCommand): Promise<TransactionsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: TransactionsResult = {
      referenceId: `sim-transactions-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: {
        simulated: true,
        principalId: command.principalId,
        payloadKeys: Object.keys(command.payload).sort(),
      },
    };
    this.ledger.set(command.idempotencyKey, result);
    return result;
  }
}
