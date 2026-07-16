import { Injectable } from '@nestjs/common';
import {
  CryptoAdapterKind,
  CryptoCommand,
  CryptoHealth,
  CryptoPort,
  CryptoResult,
} from '../../ports/crypto.port';

@Injectable()
export class CryptoSandboxAdapter implements CryptoPort {
  readonly kind: CryptoAdapterKind = 'sandbox';
  private readonly store = new Map<string, CryptoResult>();

  async health(): Promise<CryptoHealth> {
    return { ok: true, domain: 'crypto', adapter: 'sandbox' };
  }

  async execute(command: CryptoCommand): Promise<CryptoResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: CryptoResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
