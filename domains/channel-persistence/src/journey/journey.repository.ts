import type { OnboardingTransition } from './channel-journey.types';
import { ChannelJourneyMemoryStore } from './channel-journey-memory.store';

/** @deprecated Use ChannelJourneyService — mantido para compatibilidade de import. */
export class JourneyRepository extends ChannelJourneyMemoryStore {
  appendTransition(
    entry: Omit<OnboardingTransition, 'id' | 'createdAt'>,
  ): OnboardingTransition {
    return super.appendTransition(entry);
  }
}