import { randomUUID } from 'crypto';
import {
  emptyJourneySnapshot,
  type JourneySnapshot,
  type OnboardingTransition,
} from './channel-journey.types';

/** Repositório em memória — homologação unitária e NODE_ENV=test. */
export class ChannelJourneyMemoryStore {
  private snapshot: JourneySnapshot = emptyJourneySnapshot();

  get(): JourneySnapshot {
    return this.snapshot;
  }

  mutate(mutator: (draft: JourneySnapshot) => void): void {
    const draft: JourneySnapshot = structuredClone(this.snapshot);
    mutator(draft);
    this.snapshot = draft;
  }

  reset(): void {
    this.snapshot = emptyJourneySnapshot();
  }

  appendTransition(
    entry: Omit<OnboardingTransition, 'id' | 'createdAt'>,
  ): OnboardingTransition {
    const record: OnboardingTransition = {
      ...entry,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.mutate((draft) => {
      draft.transitions.push(record);
    });
    return record;
  }
}