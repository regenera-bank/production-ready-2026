import { Injectable } from '@nestjs/common';
import {
  InvestmentsAdapterKind,
  InvestmentsCommand,
  InvestmentsHealth,
  InvestmentsPort,
  InvestmentsResult,
} from '../../ports/investments.port';

@Injectable()
export class InvestmentsSandboxAdapter implements InvestmentsPort {
  readonly kind: InvestmentsAdapterKind = 'sandbox';
  private readonly store = new Map<string, InvestmentsResult>();

  async health(): Promise<InvestmentsHealth> {
    return { ok: true, domain: 'investments', adapter: 'sandbox' };
  }

  async execute(command: InvestmentsCommand): Promise<InvestmentsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: InvestmentsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
