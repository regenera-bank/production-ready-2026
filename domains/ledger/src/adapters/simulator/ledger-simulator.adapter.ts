import { Injectable } from '@nestjs/common';
import {
  LedgerAdapterKind,
  LedgerCommand,
  LedgerHealth,
  LedgerPort,
  LedgerResult,
} from '../../ports/ledger.port';

@Injectable()
export class LedgerSimulatorAdapter implements LedgerPort {
  readonly kind: LedgerAdapterKind = 'simulator';
  private readonly ledger = new Map<string, LedgerResult>();

  async health(): Promise<LedgerHealth> {
    return { ok: true, domain: 'ledger', adapter: 'simulator' };
  }

  async execute(command: LedgerCommand): Promise<LedgerResult> {
    // Contract mirrors @regenera/core-bank; simulator stays local for CI.
    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: LedgerResult = {
      referenceId: `sim-ledger-${command.idempotencyKey}`,
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
