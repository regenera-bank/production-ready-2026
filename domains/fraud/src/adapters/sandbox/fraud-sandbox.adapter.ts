import { Injectable } from '@nestjs/common';
import {
  FraudAdapterKind,
  FraudCommand,
  FraudHealth,
  FraudPort,
  FraudResult,
} from '../../ports/fraud.port';

@Injectable()
export class FraudSandboxAdapter implements FraudPort {
  readonly kind: FraudAdapterKind = 'sandbox';
  private readonly store = new Map<string, FraudResult>();

  async health(): Promise<FraudHealth> {
    return { ok: true, domain: 'fraud', adapter: 'sandbox' };
  }

  async execute(command: FraudCommand): Promise<FraudResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: FraudResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
