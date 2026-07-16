import { Injectable } from '@nestjs/common';
import {
  CardInvoicesAdapterKind,
  CardInvoicesCommand,
  CardInvoicesHealth,
  CardInvoicesPort,
  CardInvoicesResult,
} from '../../ports/card-invoices.port';

@Injectable()
export class CardInvoicesSandboxAdapter implements CardInvoicesPort {
  readonly kind: CardInvoicesAdapterKind = 'sandbox';
  private readonly store = new Map<string, CardInvoicesResult>();

  async health(): Promise<CardInvoicesHealth> {
    return { ok: true, domain: 'card-invoices', adapter: 'sandbox' };
  }

  async execute(command: CardInvoicesCommand): Promise<CardInvoicesResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: CardInvoicesResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
