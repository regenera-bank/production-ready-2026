import { Injectable } from '@nestjs/common';
import {
  DisputesAdapterKind,
  DisputesCommand,
  DisputesHealth,
  DisputesPort,
  DisputesResult,
} from '../../ports/disputes.port';

@Injectable()
export class DisputesSandboxAdapter implements DisputesPort {
  readonly kind: DisputesAdapterKind = 'sandbox';
  private readonly store = new Map<string, DisputesResult>();

  async health(): Promise<DisputesHealth> {
    return { ok: true, domain: 'disputes', adapter: 'sandbox' };
  }

  async execute(command: DisputesCommand): Promise<DisputesResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: DisputesResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
