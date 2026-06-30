import { Injectable } from '@nestjs/common';
import {
  AccountingAdapterKind,
  AccountingCommand,
  AccountingHealth,
  AccountingPort,
  AccountingResult,
} from '../../ports/accounting.port';

@Injectable()
export class AccountingSimulatorAdapter implements AccountingPort {
  readonly kind: AccountingAdapterKind = 'simulator';
  private readonly ledger = new Map<string, AccountingResult>();

  async health(): Promise<AccountingHealth> {
    return { ok: true, domain: 'accounting', adapter: 'simulator' };
  }

  async execute(command: AccountingCommand): Promise<AccountingResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: AccountingResult = {
      referenceId: `sim-accounting-${command.idempotencyKey}`,
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
