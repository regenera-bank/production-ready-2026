import { Injectable } from '@nestjs/common';
import {
  SustainabilityAdapterKind,
  SustainabilityCommand,
  SustainabilityHealth,
  SustainabilityPort,
  SustainabilityResult,
} from '../../ports/sustainability.port';

@Injectable()
export class SustainabilitySandboxAdapter implements SustainabilityPort {
  readonly kind: SustainabilityAdapterKind = 'sandbox';
  private readonly store = new Map<string, SustainabilityResult>();

  async health(): Promise<SustainabilityHealth> {
    return { ok: true, domain: 'sustainability', adapter: 'sandbox' };
  }

  async execute(command: SustainabilityCommand): Promise<SustainabilityResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: SustainabilityResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
