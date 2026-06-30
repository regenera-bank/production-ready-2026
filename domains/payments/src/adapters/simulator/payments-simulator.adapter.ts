import { Injectable } from '@nestjs/common';
import {
  PaymentsAdapterKind,
  PaymentsCommand,
  PaymentsHealth,
  PaymentsPort,
  PaymentsResult,
} from '../../ports/payments.port';

@Injectable()
export class PaymentsSimulatorAdapter implements PaymentsPort {
  readonly kind: PaymentsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, PaymentsResult>();

  async health(): Promise<PaymentsHealth> {
    return { ok: true, domain: 'payments', adapter: 'simulator' };
  }

  async execute(command: PaymentsCommand): Promise<PaymentsResult> {
    // Contract mirrors @regenera/core-bank; simulator stays local for CI.
    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: PaymentsResult = {
      referenceId: `sim-payments-${command.idempotencyKey}`,
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
