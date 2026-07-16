import {
  emptyIdentitySnapshot,
  type IdentitySnapshot,
} from './channel-identity.types';

export class ChannelIdentityMemoryStore {
  private snapshot: IdentitySnapshot = emptyIdentitySnapshot();

  get(): IdentitySnapshot {
    return this.snapshot;
  }

  mutate(mutator: (draft: IdentitySnapshot) => void): void {
    const draft: IdentitySnapshot = structuredClone(this.snapshot);
    mutator(draft);
    this.snapshot = draft;
  }

  reset(): void {
    this.snapshot = emptyIdentitySnapshot();
  }
}