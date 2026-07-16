import { Injectable } from '@nestjs/common';
import {
  ProtectionAdapterKind,
  ProtectionCommand,
  ProtectionHealth,
  ProtectionPort,
  ProtectionResult,
} from '../../ports/protection.port';

@Injectable()
export class ProtectionSandboxAdapter implements ProtectionPort {
  readonly kind: ProtectionAdapterKind = 'sandbox';
  private readonly store = new Map<string, ProtectionResult>();

  async health(): Promise<ProtectionHealth> {
    return { ok: true, domain: 'protection', adapter: 'sandbox' };
  }

  async execute(command: ProtectionCommand): Promise<ProtectionResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: ProtectionResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
