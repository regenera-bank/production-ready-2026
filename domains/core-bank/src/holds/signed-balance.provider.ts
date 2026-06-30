import { Money } from '../money/money.value-object';

// Porta para saldo do razão — PR-09 ledger substitui por projeção real.
export interface SignedBalanceProvider {
  signedBalance(ledgerAccountId: string): Promise<Money>;
}