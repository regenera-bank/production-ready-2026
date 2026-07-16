import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { OnboardingService } from '../onboarding/onboarding.service';
import { ChannelJourneyService } from '@regenera/channel-persistence';
import {
  allowedActionsForState,
  mapOnboardingToJourneyState,
} from './journey-state.mapper';
import type {
  AccountOpeningState,
  CreateJourneyInput,
  JourneyChannel,
  JourneyRecord,
  JourneyResponse,
  JourneyType,
} from './journey.types';

const JOURNEY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const newJourneyId = (): string => `jrn_${randomUUID().replace(/-/g, '')}`;

@Injectable()
export class JourneyService {
  constructor(
    private readonly journeyStore: ChannelJourneyService,
    @Inject(forwardRef(() => OnboardingService))
    private readonly onboarding: OnboardingService,
  ) {}

  async createForUser(
    userId: string,
    input: CreateJourneyInput,
    journeyType: JourneyType = 'ACCOUNT_OPENING',
  ): Promise<JourneyResponse> {
    const snapshot = this.journeyStore.get();
    const existingId = snapshot.journeyActiveByUserId?.[userId];
    if (existingId && snapshot.journeys?.[existingId]) {
      return this.toResponse(this.refreshState(existingId), userId);
    }

    const now = new Date().toISOString();
    const record: JourneyRecord = {
      journeyId: newJourneyId(),
      journeyType,
      userId,
      channel: input.channel,
      deviceId: input.deviceId,
      locale: input.locale?.trim() || 'pt-BR',
      appVersion: input.appVersion?.trim(),
      platformVersion: input.platformVersion?.trim(),
      currentState: 'DRAFT',
      version: 1,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + JOURNEY_TTL_MS).toISOString(),
    };

    this.onboarding.initForUser(userId);
    const derived = this.deriveState(userId);
    record.currentState = derived;
    record.updatedAt = new Date().toISOString();

    this.journeyStore.mutate((draft) => {
      draft.journeys ??= {};
      draft.journeyActiveByUserId ??= {};
      draft.journeys[record.journeyId] = record;
      draft.journeyActiveByUserId[userId] = record.journeyId;
    });
    if (record.currentState !== 'DRAFT') {
      this.recordStateTransition(record, 'DRAFT', record.currentState, 'CREATE_JOURNEY');
    }

    await this.journeyStore.flushPersist();
    return this.toResponse(record, userId);
  }

  getForUser(userId: string, journeyId: string): JourneyResponse {
    const record = this.requireOwned(journeyId, userId);
    return this.toResponse(this.refreshState(record.journeyId), userId);
  }

  getActiveForUser(userId: string): JourneyResponse | null {
    const snapshot = this.journeyStore.get();
    const journeyId = snapshot.journeyActiveByUserId?.[userId];
    if (!journeyId) {
      return null;
    }
    const record = snapshot.journeys?.[journeyId];
    if (!record) {
      return null;
    }
    return this.toResponse(this.refreshState(journeyId), userId);
  }

  bumpVersionForUser(userId: string): void {
    const snapshot = this.journeyStore.get();
    const journeyId = snapshot.journeyActiveByUserId?.[userId];
    if (!journeyId) {
      return;
    }
    const current = snapshot.journeys?.[journeyId];
    if (!current) {
      return;
    }
    const derived = this.deriveState(userId);
    const previous = current.currentState;
    const updated: JourneyRecord = {
      ...current,
      currentState: derived,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };
    this.journeyStore.mutate((draft) => {
      if (draft.journeys?.[journeyId]) {
        draft.journeys[journeyId] = updated;
      }
    });
    this.recordStateTransition(updated, previous, derived, 'BUMP_VERSION');
  }

  assertVersion(journeyId: string, userId: string, expected?: number): void {
    if (expected === undefined || Number.isNaN(expected)) {
      return;
    }
    const record = this.requireOwned(journeyId, userId);
    if (record.version !== expected) {
      throw new ConflictException(
        `Versão da jornada divergente — esperado ${expected}, atual ${record.version}`,
      );
    }
  }

  private refreshState(journeyId: string): JourneyRecord {
    const snapshot = this.journeyStore.get();
    const record = snapshot.journeys?.[journeyId];
    if (!record?.userId) {
      throw new NotFoundException('Jornada não encontrada');
    }
    const derived = this.deriveState(record.userId);
    if (derived === record.currentState) {
      return record;
    }
    const updated: JourneyRecord = {
      ...record,
      currentState: derived,
      updatedAt: new Date().toISOString(),
    };
    this.journeyStore.mutate((draft) => {
      if (draft.journeys?.[journeyId]) {
        draft.journeys[journeyId] = updated;
      }
    });
    this.recordStateTransition(record, record.currentState, derived, 'REFRESH_STATE');
    return updated;
  }

  private recordStateTransition(
    record: JourneyRecord,
    previousState: AccountOpeningState,
    newState: AccountOpeningState,
    command: string,
  ): void {
    if (previousState === newState || !record.userId) {
      return;
    }
    this.journeyStore.recordTransition({
      journeyId: record.journeyId,
      previousState,
      newState,
      command,
      actor: record.userId,
      channel: record.channel,
      correlationId: record.journeyId,
      version: record.version,
    });
  }

  private deriveState(userId: string): AccountOpeningState {
    const status = this.onboarding.getStatus(userId);
    return mapOnboardingToJourneyState({
      kycStatus: status.kycStatus,
      kycStep: status.kycStep,
      accountStatus: status.accountStatus,
    });
  }

  private requireOwned(journeyId: string, userId: string): JourneyRecord {
    const record = this.journeyStore.get().journeys?.[journeyId];
    if (!record || record.userId !== userId) {
      throw new NotFoundException('Jornada não encontrada');
    }
    return record;
  }

  private toResponse(record: JourneyRecord, userId: string): JourneyResponse {
    const state = this.deriveState(userId);
    return {
      journeyId: record.journeyId,
      journeyType: record.journeyType,
      customerId: userId,
      channel: record.channel,
      deviceId: record.deviceId,
      currentState: state,
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      expiresAt: record.expiresAt,
      allowedActions: allowedActionsForState(state),
    };
  }
}