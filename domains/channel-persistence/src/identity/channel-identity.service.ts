import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { Pool } from 'pg';
import { ChannelIdentityMemoryStore } from './channel-identity-memory.store';
import { ChannelIdentityPgStore } from './channel-identity-pg.store';
import {
  emptyIdentitySnapshot,
  type IdentitySnapshot,
  type SessionRecord,
  type UserRecord,
} from './channel-identity.types';

export type ChannelPersistenceMode = 'memory' | 'postgres';

export function resolveChannelPersistenceMode(): ChannelPersistenceMode {
  if (
    process.env.CHANNEL_IDENTITY_MEMORY === 'true' ||
    process.env.NODE_ENV === 'test'
  ) {
    return 'memory';
  }
  const flag = (process.env.CHANNEL_PERSISTENCE ?? 'memory').trim().toLowerCase();
  return flag === 'postgres' ? 'postgres' : 'memory';
}

@Injectable()
export class ChannelIdentityService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(ChannelIdentityService.name);
  private readonly mode = resolveChannelPersistenceMode();
  private readonly memory = new ChannelIdentityMemoryStore();
  private pgStore: ChannelIdentityPgStore | null = null;
  private pgCache: IdentitySnapshot = emptyIdentitySnapshot();
  private pgReady = false;

  constructor(@Optional() private readonly pool?: Pool) {}

  onModuleInit(): void {
    if (this.mode === 'postgres') {
      if (!this.pool) {
        throw new Error(
          'CHANNEL_PERSISTENCE=postgres exige Pool injetado no ChannelPersistenceModule',
        );
      }
      this.pgStore = new ChannelIdentityPgStore(this.pool);
      this.logger.log('Identidade canal: backend PostgreSQL (channel_experience)');
      return;
    }
    this.logger.log('Identidade canal: backend memória (homologação/teste)');
  }

  async onApplicationBootstrap(): Promise<void> {
    if (this.mode !== 'postgres' || !this.pgStore) {
      return;
    }
    this.pgCache = await this.pgStore.loadSnapshot();
    this.pgReady = true;
    this.logger.log(
      `Identidade PG carregada (${Object.keys(this.pgCache.users).length} clientes)`,
    );
  }

  get(): IdentitySnapshot {
    if (this.mode === 'postgres') {
      return this.pgCache;
    }
    return this.memory.get();
  }

  mutate(mutator: (draft: IdentitySnapshot) => void): void {
    if (this.mode === 'postgres') {
      const draft: IdentitySnapshot = structuredClone(this.pgCache);
      mutator(draft);
      this.pgCache = draft;
      return;
    }
    this.memory.mutate(mutator);
  }

  reset(): void {
    if (this.mode === 'postgres') {
      this.pgCache = emptyIdentitySnapshot();
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

  async customerExists(externalRef: string): Promise<boolean> {
    if (this.mode === 'memory') {
      return Boolean(this.memory.get().users[externalRef]);
    }
    if (this.pgCache.users[externalRef]) {
      return true;
    }
    return this.pgStore!.customerExists(externalRef);
  }

  async findUserWithPassword(externalRef: string): Promise<UserRecord | undefined> {
    if (this.mode === 'memory') {
      return this.memory.get().users[externalRef];
    }
    const cached = this.pgCache.users[externalRef];
    if (cached?.password) {
      return cached;
    }
    const user = await this.pgStore!.findUserWithPassword(externalRef);
    if (user) {
      this.mutate((draft) => {
        draft.users[externalRef] = user;
      });
    }
    return user;
  }

  async registerUserWithSession(
    user: UserRecord,
    session: SessionRecord,
  ): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        draft.users[user.userId] = user;
        draft.sessions[session.accessToken] = session;
      });
      return;
    }
    await this.pgStore!.upsertUser(user);
    await this.pgStore!.persistSession(session);
    this.mutate((draft) => {
      draft.users[user.userId] = user;
      draft.sessions[session.accessToken] = session;
    });
  }

  async persistSession(
    session: SessionRecord,
    channel: 'WEB' | 'ANDROID' | 'IOS' | 'DESKTOP' | 'PWA' = 'WEB',
    deviceFingerprint?: string,
  ): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        draft.sessions[session.accessToken] = session;
      });
      return;
    }
    await this.pgStore!.persistSession(session, channel, deviceFingerprint);
    this.mutate((draft) => {
      draft.sessions[session.accessToken] = session;
    });
  }

  async revokeSessionInStore(accessToken: string): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        delete draft.sessions[accessToken];
      });
      return;
    }
    await this.pgStore!.revokeSession(accessToken);
  }

  async refreshSession(refreshToken: string): Promise<SessionRecord | undefined> {
    if (this.mode === 'memory') {
      for (const session of Object.values(this.memory.get().sessions)) {
        if (session.refreshToken === refreshToken) {
          if (new Date(session.expiresAt).getTime() <= Date.now()) {
            return undefined;
          }
          return session;
        }
      }
      return undefined;
    }
    const match = await this.pgStore!.findSessionByRefreshToken(refreshToken);
    if (!match) {
      return undefined;
    }
    const user = this.pgCache.users[match.userId];
    if (!user) {
      return undefined;
    }
    return {
      accessToken: `pg-${match.accessTokenHash.slice(0, 32)}`,
      refreshToken,
      userId: match.userId,
      displayName: match.displayName,
      expiresAt: match.expiresAt,
    };
  }

  async rotateSession(
    oldAccessToken: string,
    next: SessionRecord,
  ): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.mutate((draft) => {
        delete draft.sessions[oldAccessToken];
        draft.sessions[next.accessToken] = next;
      });
      return;
    }
    await this.pgStore!.rotateSessionTokens(oldAccessToken, next);
    this.mutate((draft) => {
      delete draft.sessions[oldAccessToken];
      draft.sessions[next.accessToken] = next;
    });
  }

  async resolveSessionFromStore(accessToken: string): Promise<SessionRecord | undefined> {
    if (this.mode === 'memory') {
      return this.memory.get().sessions[accessToken];
    }
    const cached = this.pgCache.sessions[accessToken];
    if (cached && new Date(cached.expiresAt).getTime() > Date.now()) {
      return cached;
    }
    const session = await this.pgStore!.findSessionByToken(accessToken);
    if (session) {
      this.mutate((draft) => {
        draft.sessions[accessToken] = session;
      });
    }
    return session;
  }
}