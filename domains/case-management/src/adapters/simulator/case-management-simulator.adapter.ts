import { Injectable } from '@nestjs/common';
import {
  CaseManagementAdapterKind,
  CaseManagementCommand,
  CaseManagementHealth,
  CaseManagementPort,
  CaseManagementResult,
} from '../../ports/case-management.port';

@Injectable()
export class CaseManagementSimulatorAdapter implements CaseManagementPort {
  readonly kind: CaseManagementAdapterKind = 'simulator';
  private readonly ledger = new Map<string, CaseManagementResult>();

  async health(): Promise<CaseManagementHealth> {
    return { ok: true, domain: 'case-management', adapter: 'simulator' };
  }

  async execute(command: CaseManagementCommand): Promise<CaseManagementResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: CaseManagementResult = {
      referenceId: `sim-case-management-${command.idempotencyKey}`,
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
