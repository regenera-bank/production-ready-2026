import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { resolveChannelPersistenceMode } from '../identity/channel-identity.service';
import { ChannelBankingMemoryStore } from './channel-banking-memory.store';
import { ChannelBankingPgStore } from './channel-banking-pg.store';
import type { BankingSnapshot, PixDirectoryRecord, PixKeyRecord } from './channel-banking.types';

@Injectable()
export class ChannelBankingService implements OnModuleInit {
  private readonly logger = new Logger(ChannelBankingService.name);
  private readonly mode = resolveChannelPersistenceMode();
  private readonly memory = new ChannelBankingMemoryStore();
  private pgStore: ChannelBankingPgStore | null = null;

  constructor(@Optional() private readonly pool?: Pool) {}

  onModuleInit(): void {
    if (this.mode === 'postgres') {
      if (!this.pool) {
        throw new Error(
          'CHANNEL_PERSISTENCE=postgres exige Pool para ChannelBankingService',
        );
      }
      this.pgStore = new ChannelBankingPgStore(this.pool);
      this.logger.log('Banking canal: PostgreSQL (account_ownership, pix_keys)');
      return;
    }
    this.logger.log('Banking canal: memória (teste/homolog isolado)');
  }

  isMemoryMode(): boolean {
    return this.mode === 'memory';
  }

  get(): BankingSnapshot {
    if (this.mode === 'postgres') {
      throw new Error('get() síncrono indisponível em postgres — use memory em teste');
    }
    return this.memory.get();
  }

  mutate(mutator: (draft: BankingSnapshot) => void): void {
    if (this.mode === 'postgres') {
      throw new Error('mutate() síncrono indisponível em postgres — use memory em teste');
    }
    this.memory.mutate(mutator);
  }

  reset(): void {
    this.memory.reset();
  }

  async upsertAccountOwnership(
    userId: string,
    ledgerAccountId: string,
    correlationId: string,
  ): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        draft.accountsByUser[userId] = ledgerAccountId;
      });
      return;
    }
    await this.pgStore!.upsertAccountOwnership(userId, ledgerAccountId, correlationId);
  }

  async getAccountForUser(userId: string): Promise<string | undefined> {
    if (this.mode === 'memory') {
      return this.memory.get().accountsByUser[userId];
    }
    const snap = await this.pgStore!.loadSnapshot();
    return snap.accountsByUser[userId];
  }

  async findUserIdByLedgerAccount(
    ledgerAccountId: string,
  ): Promise<string | undefined> {
    if (this.mode === 'memory') {
      const map = this.memory.get().accountsByUser;
      return Object.entries(map).find(([, id]) => id === ledgerAccountId)?.[0];
    }
    return this.pgStore!.findUserIdByLedgerAccount(ledgerAccountId);
  }

  async listPixKeys(userId: string): Promise<PixKeyRecord[]> {
    if (this.mode === 'memory') {
      return [...(this.memory.get().pixKeysByUser[userId] ?? [])];
    }
    const snap = await this.pgStore!.loadSnapshot();
    return [...(snap.pixKeysByUser[userId] ?? [])];
  }

  async pixDirectoryHas(keyType: string, normalized: string): Promise<boolean> {
    if (this.mode === 'memory') {
      return Boolean(this.memory.get().pixDirectory[normalized]);
    }
    return this.pgStore!.pixDirectoryHas(keyType, normalized);
  }

  async registerPixKeyEntry(
    userId: string,
    ledgerAccountId: string,
    keyType: string,
    normalized: string,
    displayMask: string,
    displayName: string,
    rawKey: string,
    item: PixKeyRecord,
  ): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        const list = draft.pixKeysByUser[userId] ?? [];
        list.push(item);
        draft.pixKeysByUser[userId] = list;
        draft.pixDirectory[normalized] = {
          userId,
          displayName,
          accountId: ledgerAccountId,
          keyType,
          rawKey,
        };
      });
      return;
    }
    await this.pgStore!.registerPixKey(
      userId,
      ledgerAccountId,
      keyType,
      normalized,
      displayMask,
      displayName,
      rawKey,
    );
  }

  async getDirectoryEntry(
    keyType: string,
    normalized: string,
  ): Promise<PixDirectoryRecord | undefined> {
    if (this.mode === 'memory') {
      return this.memory.get().pixDirectory[normalized];
    }
    const entry = await this.pgStore!.getDirectoryEntry(keyType, normalized);
    return entry ?? undefined;
  }

  async syncPixDisplayName(userId: string, displayName: string): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        for (const [key, entry] of Object.entries(draft.pixDirectory)) {
          if (entry.userId === userId) {
            draft.pixDirectory[key] = { ...entry, displayName };
          }
        }
      });
      return;
    }
    await this.pgStore!.updateDisplayNameForUser(userId, displayName);
  }

  async clearActiveUsersState(userIds: string[]): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        for (const userId of userIds) {
          delete draft.accountsByUser[userId];
          draft.pixKeysByUser[userId] = [];
        }
        draft.pixDirectory = Object.fromEntries(
          Object.entries(draft.pixDirectory).filter(
            ([, entry]) => !userIds.includes(entry.userId),
          ),
        );
      });
      return;
    }
    await this.pgStore!.clearUserBankingState(userIds);
  }

  snapshotBalance(userId: string, balanceCents: string): void {
    this.mutate((draft) => {
      draft.balanceCentsByUser[userId] = balanceCents;
    });
  }

  applyWelcomeCreditMeta(userId: string, slot: number, balanceCents: string): void {
    this.mutate((draft) => {
      draft.welcomeCreditGrantedUserIds[userId] = true;
      draft.welcomeCreditAccountsOpened = slot;
      draft.balanceCentsByUser[userId] = balanceCents;
    });
  }

  getWelcomeCreditMeta(): {
    granted: Record<string, true>;
    opened: number;
    balanceCentsByUser: Record<string, string>;
  } {
    const snap = this.get();
    return {
      granted: snap.welcomeCreditGrantedUserIds,
      opened: snap.welcomeCreditAccountsOpened,
      balanceCentsByUser: snap.balanceCentsByUser,
    };
  }
}