import { Injectable } from '@nestjs/common';
import {
  IdentityAdapterKind,
  IdentityCommand,
  IdentityHealth,
  IdentityPort,
  IdentityResult,
} from '../../ports/identity.port';

@Injectable()
export class IdentitySandboxAdapter implements IdentityPort {
  readonly kind: IdentityAdapterKind = 'sandbox';
  private readonly store = new Map<string, IdentityResult>();

  async health(): Promise<IdentityHealth> {
    return { ok: true, domain: 'identity', adapter: 'sandbox' };
  }

  async execute(command: IdentityCommand): Promise<IdentityResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: IdentityResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
