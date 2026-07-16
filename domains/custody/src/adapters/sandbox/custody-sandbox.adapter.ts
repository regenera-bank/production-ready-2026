import { Injectable } from '@nestjs/common';
import {
  CustodyAdapterKind,
  CustodyCommand,
  CustodyHealth,
  CustodyPort,
  CustodyResult,
} from '../../ports/custody.port';

@Injectable()
export class CustodySandboxAdapter implements CustodyPort {
  readonly kind: CustodyAdapterKind = 'sandbox';
  private readonly store = new Map<string, CustodyResult>();

  async health(): Promise<CustodyHealth> {
    return { ok: true, domain: 'custody', adapter: 'sandbox' };
  }

  async execute(command: CustodyCommand): Promise<CustodyResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: CustodyResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
