import { Injectable } from '@nestjs/common';
import {
  InvestmentsAdapterKind,
  InvestmentsCommand,
  InvestmentsHealth,
  InvestmentsPort,
  InvestmentsResult,
} from '../../ports/investments.port';

@Injectable()
export class InvestmentsSimulatorAdapter implements InvestmentsPort {
  readonly kind: InvestmentsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, InvestmentsResult>();

  async health(): Promise<InvestmentsHealth> {
    return { ok: true, domain: 'investments', adapter: 'simulator' };
  }

  async execute(command: InvestmentsCommand): Promise<InvestmentsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: InvestmentsResult = {
      referenceId: `sim-investments-${command.idempotencyKey}`,
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
