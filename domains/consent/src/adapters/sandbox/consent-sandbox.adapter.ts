import { Injectable } from '@nestjs/common';
import {
  ConsentAdapterKind,
  ConsentCommand,
  ConsentHealth,
  ConsentPort,
  ConsentResult,
} from '../../ports/consent.port';

@Injectable()
export class ConsentSandboxAdapter implements ConsentPort {
  readonly kind: ConsentAdapterKind = 'sandbox';
  private readonly store = new Map<string, ConsentResult>();

  async health(): Promise<ConsentHealth> {
    return { ok: true, domain: 'consent', adapter: 'sandbox' };
  }

  async execute(command: ConsentCommand): Promise<ConsentResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: ConsentResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
