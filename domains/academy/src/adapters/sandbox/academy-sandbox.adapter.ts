import { Injectable } from '@nestjs/common';
import {
  AcademyAdapterKind,
  AcademyCommand,
  AcademyHealth,
  AcademyPort,
  AcademyResult,
} from '../../ports/academy.port';

@Injectable()
export class AcademySandboxAdapter implements AcademyPort {
  readonly kind: AcademyAdapterKind = 'sandbox';
  private readonly store = new Map<string, AcademyResult>();

  async health(): Promise<AcademyHealth> {
    return { ok: true, domain: 'academy', adapter: 'sandbox' };
  }

  async execute(command: AcademyCommand): Promise<AcademyResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: AcademyResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
