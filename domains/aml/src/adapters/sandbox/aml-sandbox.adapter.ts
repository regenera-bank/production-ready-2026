import { Injectable } from '@nestjs/common';
import {
  AmlAdapterKind,
  AmlCommand,
  AmlHealth,
  AmlPort,
  AmlResult,
} from '../../ports/aml.port';

@Injectable()
export class AmlSandboxAdapter implements AmlPort {
  readonly kind: AmlAdapterKind = 'sandbox';
  private readonly store = new Map<string, AmlResult>();

  async health(): Promise<AmlHealth> {
    return { ok: true, domain: 'aml', adapter: 'sandbox' };
  }

  async execute(command: AmlCommand): Promise<AmlResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: AmlResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
