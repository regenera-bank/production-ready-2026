import { Injectable } from '@nestjs/common';
import {
  TransfersAdapterKind,
  TransfersCommand,
  TransfersHealth,
  TransfersPort,
  TransfersResult,
} from '../../ports/transfers.port';

@Injectable()
export class TransfersSimulatorAdapter implements TransfersPort {
  readonly kind: TransfersAdapterKind = 'simulator';
  private readonly ledger = new Map<string, TransfersResult>();

  async health(): Promise<TransfersHealth> {
    return { ok: true, domain: 'transfers', adapter: 'simulator' };
  }

  async execute(command: TransfersCommand): Promise<TransfersResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: TransfersResult = {
      referenceId: `sim-transfers-${command.idempotencyKey}`,
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
