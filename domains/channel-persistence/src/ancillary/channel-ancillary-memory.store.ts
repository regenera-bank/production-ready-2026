import {
  AncillarySnapshot,
  emptyAncillarySnapshot,
} from './channel-ancillary.types';

export class ChannelAncillaryMemoryStore {
  private snapshot: AncillarySnapshot = emptyAncillarySnapshot();

  get(): AncillarySnapshot {
    return this.snapshot;
  }

  mutate(mutator: (draft: AncillarySnapshot) => void): void {
    const draft = structuredClone(this.snapshot);
    mutator(draft);
    this.snapshot = draft;
  }

  reset(): void {
    this.snapshot = emptyAncillarySnapshot();
  }
}