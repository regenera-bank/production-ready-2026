import { Injectable } from '@nestjs/common';
import {
  KycAdapterKind,
  KycCommand,
  KycHealth,
  KycPort,
  KycResult,
} from '../../ports/kyc.port';

@Injectable()
export class KycSandboxAdapter implements KycPort {
  readonly kind: KycAdapterKind = 'sandbox';
  private readonly store = new Map<string, KycResult>();

  async health(): Promise<KycHealth> {
    return { ok: true, domain: 'kyc', adapter: 'sandbox' };
  }

  async execute(command: KycCommand): Promise<KycResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: KycResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
