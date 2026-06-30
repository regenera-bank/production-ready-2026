import { Injectable } from '@nestjs/common';
import {
  CryptoAdapterKind,
  CryptoCommand,
  CryptoHealth,
  CryptoPort,
  CryptoResult,
} from '../../ports/crypto.port';

@Injectable()
export class CryptoSimulatorAdapter implements CryptoPort {
  readonly kind: CryptoAdapterKind = 'simulator';
  private readonly ledger = new Map<string, CryptoResult>();

  async health(): Promise<CryptoHealth> {
    return { ok: true, domain: 'crypto', adapter: 'simulator' };
  }

  async execute(command: CryptoCommand): Promise<CryptoResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: CryptoResult = {
      referenceId: `sim-crypto-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: {
        simulated: true,
        principalId: command.principalId,
        payloadKeys: Object.keys(command.payload).sort(),
      },
    };
    this.ledger.set(command.idempotencyKey, result);
    return result;
  }
}
