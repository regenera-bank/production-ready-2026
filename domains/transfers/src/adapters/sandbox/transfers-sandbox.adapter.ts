import { Injectable } from '@nestjs/common';
import {
  TransfersAdapterKind,
  TransfersCommand,
  TransfersHealth,
  TransfersPort,
  TransfersResult,
} from '../../ports/transfers.port';

@Injectable()
export class TransfersSandboxAdapter implements TransfersPort {
  readonly kind: TransfersAdapterKind = 'sandbox';
  private readonly store = new Map<string, TransfersResult>();

  async health(): Promise<TransfersHealth> {
    return { ok: true, domain: 'transfers', adapter: 'sandbox' };
  }

  async execute(command: TransfersCommand): Promise<TransfersResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: TransfersResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
