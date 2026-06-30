import { Injectable } from '@nestjs/common';
import {
  CardInvoicesAdapterKind,
  CardInvoicesCommand,
  CardInvoicesHealth,
  CardInvoicesPort,
  CardInvoicesResult,
} from '../../ports/card-invoices.port';

@Injectable()
export class CardInvoicesSimulatorAdapter implements CardInvoicesPort {
  readonly kind: CardInvoicesAdapterKind = 'simulator';
  private readonly ledger = new Map<string, CardInvoicesResult>();

  async health(): Promise<CardInvoicesHealth> {
    return { ok: true, domain: 'card-invoices', adapter: 'simulator' };
  }

  async execute(command: CardInvoicesCommand): Promise<CardInvoicesResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: CardInvoicesResult = {
      referenceId: `sim-card-invoices-${command.idempotencyKey}`,
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
