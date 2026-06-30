import { Injectable } from '@nestjs/common';
import {
  AccountsAdapterKind,
  AccountsCommand,
  AccountsHealth,
  AccountsPort,
  AccountsResult,
} from '../../ports/accounts.port';

@Injectable()
export class AccountsSimulatorAdapter implements AccountsPort {
  readonly kind: AccountsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, AccountsResult>();

  async health(): Promise<AccountsHealth> {
    return { ok: true, domain: 'accounts', adapter: 'simulator' };
  }

  async execute(command: AccountsCommand): Promise<AccountsResult> {
    // Contract mirrors @regenera/core-bank; simulator stays local for CI.
    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: AccountsResult = {
      referenceId: `sim-accounts-${command.idempotencyKey}`,
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
