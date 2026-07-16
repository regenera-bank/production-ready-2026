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
    const action = String(command.payload.action ?? 'ping');
    if (action === 'get_offers') {
      const result: CreditResult = {
        referenceId: `sbx-${command.idempotencyKey}`,
        status: 'ACCEPTED',
        metadata: {
          sandbox: true,
          offers: [
            {
              id: 'credit-personal-sbx',
              name: 'Crédito Pessoal Sandbox',
              maxAmountCents: '500000',
              ratePct: '1.99',
            },
            {
              id: 'credit-overdraft-sbx',
              name: 'Cheque Especial Sandbox',
              maxAmountCents: '100000',
              ratePct: '2.49',
            },
          ],
        },
      };
      this.store.set(command.idempotencyKey, result);
      return result;
    }
    const result: CreditResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId, action },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
