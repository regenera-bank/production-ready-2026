import { Injectable } from '@nestjs/common';
import {
  CaseManagementAdapterKind,
  CaseManagementCommand,
  CaseManagementHealth,
  CaseManagementPort,
  CaseManagementResult,
} from '../../ports/case-management.port';

@Injectable()
export class CaseManagementSandboxAdapter implements CaseManagementPort {
  readonly kind: CaseManagementAdapterKind = 'sandbox';
  private readonly store = new Map<string, CaseManagementResult>();

  async health(): Promise<CaseManagementHealth> {
    return { ok: true, domain: 'case-management', adapter: 'sandbox' };
  }

  async execute(command: CaseManagementCommand): Promise<CaseManagementResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: CaseManagementResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
