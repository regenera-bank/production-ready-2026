import { Injectable } from '@nestjs/common';
import {
  PaymentsAdapterKind,
  PaymentsCommand,
  PaymentsHealth,
  PaymentsPort,
  PaymentsResult,
} from '../../ports/payments.port';

@Injectable()
export class PaymentsSandboxAdapter implements PaymentsPort {
  readonly kind: PaymentsAdapterKind = 'sandbox';
  private readonly store = new Map<string, PaymentsResult>();

  async health(): Promise<PaymentsHealth> {
    return { ok: true, domain: 'payments', adapter: 'sandbox' };
  }

  async execute(command: PaymentsCommand): Promise<PaymentsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: PaymentsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
