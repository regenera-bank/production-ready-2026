import { Injectable } from '@nestjs/common';
import {
  BenefitsAdapterKind,
  BenefitsCommand,
  BenefitsHealth,
  BenefitsPort,
  BenefitsResult,
} from '../../ports/benefits.port';

@Injectable()
export class BenefitsSandboxAdapter implements BenefitsPort {
  readonly kind: BenefitsAdapterKind = 'sandbox';
  private readonly store = new Map<string, BenefitsResult>();

  async health(): Promise<BenefitsHealth> {
    return { ok: true, domain: 'benefits', adapter: 'sandbox' };
  }

  async execute(command: BenefitsCommand): Promise<BenefitsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: BenefitsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
