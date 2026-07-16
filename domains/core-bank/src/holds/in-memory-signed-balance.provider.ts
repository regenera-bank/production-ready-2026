import { Injectable } from '@nestjs/common';
import { Money } from '../money/money.value-object';
import { SignedBalanceProvider } from './signed-balance.provider';

@Injectable()
export class InMemorySignedBalanceProvider implements SignedBalanceProvider {
  private readonly balances = new Map<string, Money>();

  setBalance(ledgerAccountId: string, balance: Money): void {
    this.balances.set(ledgerAccountId, balance);
  }

  async signedBalance(ledgerAccountId: string): Promise<Money> {
    return this.balances.get(ledgerAccountId) ?? Money.zero();
  }

  clear(): void {
    this.balances.clear();
  }
}