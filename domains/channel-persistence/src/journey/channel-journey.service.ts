import { randomUUID } from 'crypto';
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { Pool } from 'pg';
import { resolveChannelPersistenceMode } from '../identity/channel-identity.service';
import { ChannelJourneyMemoryStore } from './channel-journey-memory.store';
import { ChannelJourneyPgStore } from './channel-journey-pg.store';
import type { JourneySnapshot, OnboardingTransition } from './channel-journey.types';
import { emptyJourneySnapshot } from './channel-journey.types';

@Injectable()
export class ChannelJourneyService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(ChannelJourneyService.name);
  private readonly mode = resolveChannelPersistenceMode();
  private readonly memory = new ChannelJourneyMemoryStore();
  private pgStore: ChannelJourneyPgStore | null = null;
  private pgCache: JourneySnapshot = emptyJourneySnapshot();
  private pgReady = false;
  private persistChain: Promise<void> = Promise.resolve();

  constructor(@Optional() private readonly pool?: Pool) {}

  onModuleInit(): void {
    if (this.mode === 'postgres') {
      if (!this.pool) {
        throw new Error(
          'CHANNEL_PERSISTENCE=postgres exige Pool injetado no ChannelPersistenceModule',
        );
      }
      this.pgStore = new ChannelJourneyPgStore(this.pool);
      this.logger.log('Jornada canal: backend PostgreSQL (channel_experience fase 2)');
      return;
    }
    this.logger.log('Jornada canal: backend memória (homologação/teste)');
  }

  async onApplicationBootstrap(): Promise<void> {
    if (this.mode !== 'postgres' || !this.pgStore) {
      return;
    }
    this.pgCache = await this.pgStore.loadSnapshot();
    this.pgReady = true;
    this.logger.log(
      `Jornada PG carregada (${Object.keys(this.pgCache.journeys).length} jornadas, ${Object.keys(this.pgCache.onboarding).length} perfis)`,
    );
  }

  get(): JourneySnapshot {
    if (this.mode === 'postgres') {
      return this.pgCache;
    }
    return this.memory.get();
  }

  mutate(mutator: (draft: JourneySnapshot) => void): void {
    if (this.mode === 'postgres') {
      const draft: JourneySnapshot = structuredClone(this.pgCache);
      mutator(draft);
      this.pgCache = draft;
      this.enqueuePersist(draft);
      return;
    }
    this.memory.mutate(mutator);
  }

  reset(): void {
    if (this.mode === 'postgres') {
      this.pgCache = emptyJourneySnapshot();
      this.pgReady = false;
      return;
    }
    this.memory.reset();
  }

  isMemoryMode(): boolean {
    return this.mode === 'memory';
  }

  isPostgresReady(): boolean {
    return this.mode === 'memory' || this.pgReady;
  }

  /** Aguarda write-through PG pendente — evita resposta HTTP antes da persistência. */
  async flushPersist(): Promise<void> {
    await this.persistChain;
  }

  async journeyExistsInPg(journeyId: string): Promise<boolean> {
    if (this.mode === 'memory' || !this.pgStore) {
      return Boolean(this.memory.get().journeys[journeyId]);
    }
    return this.pgStore.journeyExists(journeyId);
  }

  recordTransition(
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

  private enqueuePersist(snapshot: JourneySnapshot): void {
    if (!this.pgStore) {
      return;
    }
    const frozen = structuredClone(snapshot);
    this.persistChain = this.persistChain
      .then(() => this.pgStore!.syncSnapshot(frozen))
      .catch((error) => {
        this.logger.error(
          `Write-through jornada PG falhou: ${error instanceof Error ? error.message : error}`,
        );
      });
  }
}