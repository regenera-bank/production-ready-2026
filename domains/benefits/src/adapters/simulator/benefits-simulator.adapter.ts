import { Injectable } from '@nestjs/common';
import {
  BenefitsAdapterKind,
  BenefitsCommand,
  BenefitsHealth,
  BenefitsPort,
  BenefitsResult,
} from '../../ports/benefits.port';

@Injectable()
export class BenefitsSimulatorAdapter implements BenefitsPort {
  readonly kind: BenefitsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, BenefitsResult>();

  async health(): Promise<BenefitsHealth> {
    return { ok: true, domain: 'benefits', adapter: 'simulator' };
  }

  async execute(command: BenefitsCommand): Promise<BenefitsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: BenefitsResult = {
      referenceId: `sim-benefits-${command.idempotencyKey}`,
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
