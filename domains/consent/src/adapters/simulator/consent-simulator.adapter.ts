import { Injectable } from '@nestjs/common';
import {
  ConsentAdapterKind,
  ConsentCommand,
  ConsentHealth,
  ConsentPort,
  ConsentResult,
} from '../../ports/consent.port';

@Injectable()
export class ConsentSimulatorAdapter implements ConsentPort {
  readonly kind: ConsentAdapterKind = 'simulator';
  private readonly ledger = new Map<string, ConsentResult>();

  async health(): Promise<ConsentHealth> {
    return { ok: true, domain: 'consent', adapter: 'simulator' };
  }

  async execute(command: ConsentCommand): Promise<ConsentResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: ConsentResult = {
      referenceId: `sim-consent-${command.idempotencyKey}`,
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
