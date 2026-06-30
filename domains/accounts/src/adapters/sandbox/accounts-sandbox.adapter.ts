import { Injectable } from '@nestjs/common';
import {
  AccountsAdapterKind,
  AccountsCommand,
  AccountsHealth,
  AccountsPort,
  AccountsResult,
} from '../../ports/accounts.port';

@Injectable()
export class AccountsSandboxAdapter implements AccountsPort {
  readonly kind: AccountsAdapterKind = 'sandbox';
  private readonly store = new Map<string, AccountsResult>();

  async health(): Promise<AccountsHealth> {
    return { ok: true, domain: 'accounts', adapter: 'sandbox' };
  }

  async execute(command: AccountsCommand): Promise<AccountsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: AccountsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
