import { Injectable } from '@nestjs/common';
import {
  KidsAdapterKind,
  KidsCommand,
  KidsHealth,
  KidsPort,
  KidsResult,
} from '../../ports/kids.port';

@Injectable()
export class KidsSimulatorAdapter implements KidsPort {
  readonly kind: KidsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, KidsResult>();

  async health(): Promise<KidsHealth> {
    return { ok: true, domain: 'kids', adapter: 'simulator' };
  }

  async execute(command: KidsCommand): Promise<KidsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: KidsResult = {
      referenceId: `sim-kids-${command.idempotencyKey}`,
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
