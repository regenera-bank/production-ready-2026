import { Injectable } from '@nestjs/common';
import {
  CreditAdapterKind,
  CreditCommand,
  CreditHealth,
  CreditPort,
  CreditResult,
} from '../../ports/credit.port';

@Injectable()
export class CreditSimulatorAdapter implements CreditPort {
  readonly kind: CreditAdapterKind = 'simulator';
  private readonly ledger = new Map<string, CreditResult>();

  async health(): Promise<CreditHealth> {
    return { ok: true, domain: 'credit', adapter: 'simulator' };
  }

  async execute(command: CreditCommand): Promise<CreditResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: CreditResult = {
      referenceId: `sim-credit-${command.idempotencyKey}`,
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
