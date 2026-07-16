import { Injectable } from '@nestjs/common';
import {
  CustodyAdapterKind,
  CustodyCommand,
  CustodyHealth,
  CustodyPort,
  CustodyResult,
} from '../../ports/custody.port';

@Injectable()
export class CustodySimulatorAdapter implements CustodyPort {
  readonly kind: CustodyAdapterKind = 'simulator';
  private readonly ledger = new Map<string, CustodyResult>();

  async health(): Promise<CustodyHealth> {
    return { ok: true, domain: 'custody', adapter: 'simulator' };
  }

  async execute(command: CustodyCommand): Promise<CustodyResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: CustodyResult = {
      referenceId: `sim-custody-${command.idempotencyKey}`,
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
