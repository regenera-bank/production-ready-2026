import { Injectable } from '@nestjs/common';
import {
  ReconciliationAdapterKind,
  ReconciliationCommand,
  ReconciliationHealth,
  ReconciliationPort,
  ReconciliationResult,
} from '../../ports/reconciliation.port';

@Injectable()
export class ReconciliationSimulatorAdapter implements ReconciliationPort {
  readonly kind: ReconciliationAdapterKind = 'simulator';
  private readonly ledger = new Map<string, ReconciliationResult>();

  async health(): Promise<ReconciliationHealth> {
    return { ok: true, domain: 'reconciliation', adapter: 'simulator' };
  }

  async execute(command: ReconciliationCommand): Promise<ReconciliationResult> {
    // Contract mirrors @regenera/core-bank; simulator stays local for CI.
    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: ReconciliationResult = {
      referenceId: `sim-reconciliation-${command.idempotencyKey}`,
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
