import { Injectable } from '@nestjs/common';
import {
  SanctionsAdapterKind,
  SanctionsCommand,
  SanctionsHealth,
  SanctionsPort,
  SanctionsResult,
} from '../../ports/sanctions.port';

@Injectable()
export class SanctionsSimulatorAdapter implements SanctionsPort {
  readonly kind: SanctionsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, SanctionsResult>();

  async health(): Promise<SanctionsHealth> {
    return { ok: true, domain: 'sanctions', adapter: 'simulator' };
  }

  async execute(command: SanctionsCommand): Promise<SanctionsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: SanctionsResult = {
      referenceId: `sim-sanctions-${command.idempotencyKey}`,
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
