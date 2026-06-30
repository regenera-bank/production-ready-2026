import { Injectable } from '@nestjs/common';
import {
  AccountingAdapterKind,
  AccountingCommand,
  AccountingHealth,
  AccountingPort,
  AccountingResult,
} from '../../ports/accounting.port';

@Injectable()
export class AccountingSandboxAdapter implements AccountingPort {
  readonly kind: AccountingAdapterKind = 'sandbox';
  private readonly store = new Map<string, AccountingResult>();

  async health(): Promise<AccountingHealth> {
    return { ok: true, domain: 'accounting', adapter: 'sandbox' };
  }

  async execute(command: AccountingCommand): Promise<AccountingResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: AccountingResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
