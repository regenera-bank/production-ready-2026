import { Injectable } from '@nestjs/common';
import {
  InsuranceAdapterKind,
  InsuranceCommand,
  InsuranceHealth,
  InsurancePort,
  InsuranceResult,
} from '../../ports/insurance.port';

@Injectable()
export class InsuranceSandboxAdapter implements InsurancePort {
  readonly kind: InsuranceAdapterKind = 'sandbox';
  private readonly store = new Map<string, InsuranceResult>();

  async health(): Promise<InsuranceHealth> {
    return { ok: true, domain: 'insurance', adapter: 'sandbox' };
  }

  async execute(command: InsuranceCommand): Promise<InsuranceResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: InsuranceResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
