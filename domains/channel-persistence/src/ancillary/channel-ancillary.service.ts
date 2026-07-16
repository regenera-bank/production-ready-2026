import { Injectable, Logger, OnApplicationBootstrap, OnModuleInit, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { resolveChannelPersistenceMode } from '../identity/channel-identity.service';
import { ChannelAncillaryMemoryStore } from './channel-ancillary-memory.store';
import { ChannelAncillaryPgStore } from './channel-ancillary-pg.store';
import type {
  AncillarySnapshot,
  ConsentChannel,
  ConsentRecord,
  ConsentType,
  SandboxAuditEntry,
  StoredPasskeyRecord,
} from './channel-ancillary.types';

@Injectable()
export class ChannelAncillaryService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(ChannelAncillaryService.name);
  private readonly mode = resolveChannelPersistenceMode();
  private readonly memory = new ChannelAncillaryMemoryStore();
  private pgStore: ChannelAncillaryPgStore | null = null;
  private pgCache: AncillarySnapshot | null = null;

  constructor(@Optional() private readonly pool?: Pool) {}

  onModuleInit(): void {
    if (this.mode === 'postgres') {
      if (!this.pool) {
        throw new Error(
          'CHANNEL_PERSISTENCE=postgres exige Pool para ChannelAncillaryService',
        );
      }
      this.pgStore = new ChannelAncillaryPgStore(this.pool);
      this.logger.log('Ancillary canal: PostgreSQL (consents, passkeys, Audit)');
      return;
    }
    this.logger.log('Ancillary canal: memória (teste/homolog isolado)');
  }

  async onApplicationBootstrap(): Promise<void> {
    if (this.mode !== 'postgres' || !this.pgStore) {
      return;
    }
    this.pgCache = await this.pgStore.loadSnapshot();
    this.logger.log('Ancillary PG carregado');
  }

  private snapshot(): AncillarySnapshot {
    if (this.mode === 'postgres') {
      return this.pgCache ?? this.memory.get();
    }
    return this.memory.get();
  }

  mutate(mutator: (draft: AncillarySnapshot) => void): void {
    if (this.mode === 'postgres') {
      const draft = structuredClone(this.snapshot());
      mutator(draft);
      this.pgCache = draft;
      return;
    }
    this.memory.mutate(mutator);
  }

  reset(): void {
    this.memory.reset();
    this.pgCache = null;
  }

  listConsents(userId: string): ConsentRecord[] {
    return [...(this.snapshot().consents[userId] ?? [])];
  }

  async acceptConsent(record: ConsentRecord): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        const list = draft.consents[record.userId] ?? [];
        const revoked = list.map((item) =>
          item.type === record.type && !item.revokedAt
            ? { ...item, revokedAt: record.acceptedAt }
            : item,
        );
        revoked.push(record);
        draft.consents[record.userId] = revoked;
      });
      return;
    }
    await this.pgStore!.insertConsent(record.userId, record);
    this.mutate((draft) => {
      const list = draft.consents[record.userId] ?? [];
      const revoked = list.map((item) =>
        item.type === record.type && !item.revokedAt
          ? { ...item, revokedAt: record.acceptedAt }
          : item,
      );
      revoked.push(record);
      draft.consents[record.userId] = revoked;
    });
  }

  async revokeConsent(userId: string, type: ConsentType, revokedAt: string): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        const list = draft.consents[userId] ?? [];
        draft.consents[userId] = list.map((item) =>
          item.type === type && !item.revokedAt ? { ...item, revokedAt } : item,
        );
      });
      return;
    }
    await this.pgStore!.revokeConsent(userId, type, revokedAt);
    this.mutate((draft) => {
      const list = draft.consents[userId] ?? [];
      draft.consents[userId] = list.map((item) =>
        item.type === type && !item.revokedAt ? { ...item, revokedAt } : item,
      );
    });
  }

  listPasskeys(userId: string): StoredPasskeyRecord[] {
    return [...(this.snapshot().passkeys[userId] ?? [])];
  }

  async savePasskeys(userId: string, records: StoredPasskeyRecord[]): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        draft.passkeys[userId] = records;
      });
      return;
    }
    for (const record of records) {
      await this.pgStore!.upsertPasskey(userId, record);
    }
    this.mutate((draft) => {
      draft.passkeys[userId] = records;
    });
  }

  async updatePasskeyCounter(
    userId: string,
    credentialId: string,
    counter: number,
  ): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        const list = draft.passkeys[userId] ?? [];
        draft.passkeys[userId] = list.map((item) =>
          item.credentialId === credentialId ? { ...item, counter } : item,
        );
      });
      return;
    }
    await this.pgStore!.updatePasskeyCounter(credentialId, counter);
    this.mutate((draft) => {
      const list = draft.passkeys[userId] ?? [];
      draft.passkeys[userId] = list.map((item) =>
        item.credentialId === credentialId ? { ...item, counter } : item,
      );
    });
  }

  listPrometeoPayments(): Record<string, Record<string, unknown>> {
    return { ...this.snapshot().prometeoPayments };
  }

  getPrometeoPayment(requestId: string): Record<string, unknown> | undefined {
    return this.snapshot().prometeoPayments[requestId];
  }

  hasPrometeoEvent(eventId: string): boolean {
    return Boolean(this.snapshot().prometeoProcessedEventIds[eventId]);
  }

  mutatePrometeo(
    mutator: (draft: {
      prometeoPayments: Record<string, Record<string, unknown>>;
      prometeoProcessedEventIds: Record<string, string>;
    }) => void,
  ): void {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => mutator(draft));
      return;
    }
    this.mutate((draft) => mutator(draft));
  }

  async putPrometeoPayment(
    requestId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        draft.prometeoPayments[requestId] = payload;
      });
      return;
    }
    await this.pgStore!.putIntegrationRecord('prometeo_payment', requestId, payload);
    this.mutate((draft) => {
      draft.prometeoPayments[requestId] = payload;
    });
  }

  async markPrometeoEvent(eventId: string): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        draft.prometeoProcessedEventIds[eventId] = eventId;
      });
      return;
    }
    await this.pgStore!.putIntegrationRecord('prometeo_event', eventId, { eventId });
    this.mutate((draft) => {
      draft.prometeoProcessedEventIds[eventId] = eventId;
    });
  }

  async appendSandboxAudit(entry: SandboxAuditEntry): Promise<void> {
    if (this.mode === 'memory') {
      return;
    }
    await this.pgStore!.appendSandboxAudit({
      domain: entry.domain,
      userId: entry.userId,
      moduleId: entry.moduleId,
      action: entry.action,
      referenceId: entry.referenceId,
      status: entry.status,
      payload: entry.payload,
    });
  }

  async recordProductsAudit(
    userId: string,
    action: string,
    referenceId: string,
    status: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    const entry: SandboxAuditEntry = {
      id: referenceId,
      userId,
      domain: 'products',
      action,
      referenceId,
      status,
      at: new Date().toISOString(),
      payload,
    };
    await this.appendSandboxAudit(entry);
  }

  async recordLifestyleAudit(
    userId: string,
    moduleId: string,
    action: string,
    referenceId: string,
    status: string,
  ): Promise<void> {
    const entry: SandboxAuditEntry = {
      id: referenceId,
      userId,
      domain: 'lifestyle',
      moduleId,
      action,
      referenceId,
      status,
      at: new Date().toISOString(),
    };
    await this.appendSandboxAudit(entry);
  }

  static consentChannel(value?: string): ConsentChannel {
    const normalized = value?.trim().toLowerCase();
    if (normalized === 'android' || normalized === 'ios' || normalized === 'pwa') {
      return normalized;
    }
    return 'web';
  }
}