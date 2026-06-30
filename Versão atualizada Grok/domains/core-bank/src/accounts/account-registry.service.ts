import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AccountClass,
  AccountStatus,
  LedgerAccount,
} from './account.entity';
import { AccountRepository } from './account.repository';
import { CurrencyCode } from '../money/money.value-object';
import {
  ConflictException,
  NotFoundException,
  StateTransitionException,
} from '../errors/core-banking.errors';

export interface OpenAccountCommand {
  accountClass: AccountClass;
  currency?: CurrencyCode;
  externalReference?: string;
}

@Injectable()
export class AccountRegistryService {
  constructor(private readonly accounts: AccountRepository) {}

  async open(command: OpenAccountCommand): Promise<LedgerAccount> {
    if (command.externalReference) {
      const existing = await this.accounts.findByExternalReference(
        command.externalReference,
      );
      if (existing) {
        throw new ConflictException(
          'Referência externa já vinculada a conta',
          'ACCOUNT_EXTERNAL_REFERENCE_EXISTS',
          { externalReference: command.externalReference, accountId: existing.id },
        );
      }
    }

    const account = LedgerAccount.open({
      id: randomUUID(),
      accountClass: command.accountClass,
      currency: command.currency,
      externalReference: command.externalReference ?? null,
    });

    return this.accounts.save(account);
  }

  async block(accountId: string): Promise<LedgerAccount> {
    const account = await this.requireExists(accountId);
    const blocked = account.transitionTo(AccountStatus.BLOCKED);
    return this.accounts.save(blocked);
  }

  async close(accountId: string): Promise<LedgerAccount> {
    const account = await this.requireExists(accountId);
    const closed = account.transitionTo(AccountStatus.CLOSED);
    return this.accounts.save(closed);
  }

  async requireOpen(accountId: string): Promise<LedgerAccount> {
    const account = await this.requireExists(accountId);
    if (!account.isOpen()) {
      throw new StateTransitionException(
        'Conta não está OPEN — operação financeira bloqueada',
        'ACCOUNT_NOT_OPEN',
        { accountId, status: account.status },
      );
    }
    return account;
  }

  async getById(accountId: string): Promise<LedgerAccount | null> {
    return this.accounts.findById(accountId);
  }

  private async requireExists(accountId: string): Promise<LedgerAccount> {
    const account = await this.accounts.findById(accountId);
    if (!account) {
      throw new NotFoundException(
        'Conta não encontrada',
        'ACCOUNT_NOT_FOUND',
        { accountId },
      );
    }
    return account;
  }
}