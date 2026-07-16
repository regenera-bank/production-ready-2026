import { Injectable } from '@nestjs/common';
import {
  SanctionsAdapterKind,
  SanctionsCommand,
  SanctionsHealth,
  SanctionsPort,
  SanctionsResult,
} from '../../ports/sanctions.port';

@Injectable()
export class SanctionsSandboxAdapter implements SanctionsPort {
  readonly kind: SanctionsAdapterKind = 'sandbox';
  private readonly store = new Map<string, SanctionsResult>();

  async health(): Promise<SanctionsHealth> {
    return { ok: true, domain: 'sanctions', adapter: 'sandbox' };
  }

  async execute(command: SanctionsCommand): Promise<SanctionsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: SanctionsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
