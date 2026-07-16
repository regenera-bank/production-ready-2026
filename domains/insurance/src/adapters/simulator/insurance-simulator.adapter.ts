import { Injectable } from '@nestjs/common';
import {
  InsuranceAdapterKind,
  InsuranceCommand,
  InsuranceHealth,
  InsurancePort,
  InsuranceResult,
} from '../../ports/insurance.port';

@Injectable()
export class InsuranceSimulatorAdapter implements InsurancePort {
  readonly kind: InsuranceAdapterKind = 'simulator';
  private readonly ledger = new Map<string, InsuranceResult>();

  async health(): Promise<InsuranceHealth> {
    return { ok: true, domain: 'insurance', adapter: 'simulator' };
  }

  async execute(command: InsuranceCommand): Promise<InsuranceResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: InsuranceResult = {
      referenceId: `sim-insurance-${command.idempotencyKey}`,
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
