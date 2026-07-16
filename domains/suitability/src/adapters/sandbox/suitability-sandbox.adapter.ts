import { Injectable } from '@nestjs/common';
import {
  SuitabilityAdapterKind,
  SuitabilityCommand,
  SuitabilityHealth,
  SuitabilityPort,
  SuitabilityResult,
} from '../../ports/suitability.port';

@Injectable()
export class SuitabilitySandboxAdapter implements SuitabilityPort {
  readonly kind: SuitabilityAdapterKind = 'sandbox';
  private readonly store = new Map<string, SuitabilityResult>();

  async health(): Promise<SuitabilityHealth> {
    return { ok: true, domain: 'suitability', adapter: 'sandbox' };
  }

  async execute(command: SuitabilityCommand): Promise<SuitabilityResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: SuitabilityResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
