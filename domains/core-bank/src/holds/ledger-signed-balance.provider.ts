import { Injectable } from '@nestjs/common';
import { AccountRepository } from '../accounts/account.repository';
import { LedgerService } from '../ledger/ledger.service';
import { Money } from '../money/money.value-object';
import { SignedBalanceProvider } from './signed-balance.provider';

@Injectable()
export class LedgerSignedBalanceProvider implements SignedBalanceProvider {
  constructor(
    private readonly ledger: LedgerService,
    private readonly accounts: AccountRepository,
  ) {}

  async signedBalance(ledgerAccountId: string): Promise<Money> {
    const account = await this.accounts.findById(ledgerAccountId);
    if (!account) {
      return Money.zero();
    }
    return this.ledger.signedBalance(
      ledgerAccountId,
      account.accountClass,
    );
  }
}