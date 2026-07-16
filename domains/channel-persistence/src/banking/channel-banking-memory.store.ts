import type { BankingSnapshot } from './channel-banking.types';
import { emptyBankingSnapshot } from './channel-banking.types';

export class ChannelBankingMemoryStore {
  private snapshot = emptyBankingSnapshot();

  get(): BankingSnapshot {
    return this.snapshot;
  }

  mutate(mutator: (draft: BankingSnapshot) => void): void {
    const draft = structuredClone(this.snapshot);
    mutator(draft);
    this.snapshot = draft;
  }

  reset(): void {
    this.snapshot = emptyBankingSnapshot();
  }
}