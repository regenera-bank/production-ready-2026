import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
import {
  ChannelIdentityService,
  type PasswordResetAuditRecord,
  type SessionRecord,
  type UserRecord,
} from '@regenera/channel-persistence';
import { isDiditKycProvider } from '../config/kyc-provider';
import type { AddressRecord } from '../onboarding/onboarding.types';
import {
  hashPassword,
  isPasswordHashed,
  verifyPassword,
} from './password-hash';

export type { SessionRecord, UserRecord } from '@regenera/channel-persistence';

export interface RegisterInput {
  readonly document: string;
  readonly password: string;
  readonly displayName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly birthDate?: string;
  readonly address?: AddressRecord;
}

export interface ProfileUpdateInput {
  readonly document: string;
  readonly displayName: string;
  readonly email: string;
  readonly phone: string;
  readonly birthDate: string;
  readonly address: AddressRecord;
}

const DIDIT_PROFILE_PLACEHOLDER_BIRTH = '1900-01-01';

const diditPendingAddress = (): AddressRecord => ({
  street: 'Pendente Didit',
  number: '0',
  neighborhood: '-',
  city: '-',
  state: 'SP',
  postalCode: '00000000',
});

const normalizeDocument = (document: string): string =>
  document.replace(/\D/g, '').slice(-11) || 'guest';

const normalizePhone = (phone: string): string => phone.replace(/\D/g, '');

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const PASSWORD_RESET_RATE_WINDOW_MS = 60 * 60 * 1000;
const PASSWORD_RESET_RATE_MAX = 5;
const PASSWORD_RESET_MIN_LENGTH = 8;

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const hashDocumentForAudit = (document: string): string =>
  createHash('sha256').update(normalizeDocument(document)).digest('hex').slice(0, 16);

export interface PasswordResetRequestResult {
  readonly acknowledged: true;
  readonly message: string;
  readonly devToken?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly identity: ChannelIdentityService) {}

  async register(input: RegisterInput): Promise<SessionRecord> {
    const doc = input.document?.trim() ?? '';
    const pwd = input.password?.trim() ?? '';
    if (!doc || !pwd) {
      throw new BadRequestException('Informe CPF e senha');
    }
    if (pwd.length < PASSWORD_RESET_MIN_LENGTH) {
      throw new BadRequestException(
        `Senha deve ter pelo menos ${PASSWORD_RESET_MIN_LENGTH} caracteres`,
      );
    }

    if (isDiditKycProvider()) {
      return this.registerDiditMinimal(doc, pwd, input.displayName?.trim());
    }

    const name = input.displayName?.trim() ?? '';
    const email = input.email?.trim().toLowerCase() ?? '';
    const phone = normalizePhone(input.phone ?? '');
    const birthDate = input.birthDate?.trim() ?? '';
    if (!name || !email || !phone || !birthDate) {
      throw new BadRequestException(
        'Preencha CPF, senha, nome, e-mail, telefone e data de nascimento',
      );
    }
    if (!input.address?.street?.trim() || !input.address?.postalCode?.trim()) {
      throw new BadRequestException('Endereço incompleto no cadastro');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      throw new UnauthorizedException(
        'Data de nascimento inválida — use AAAA-MM-DD',
      );
    }
    return this.persistNewUser({
      document: doc,
      password: pwd,
      displayName: name,
      email,
      phone,
      birthDate,
      address: input.address,
    });
  }

  /** Didit assume identidade — só CPF + senha; dados reais vêm do webhook. */
  private async registerDiditMinimal(
    document: string,
    password: string,
    displayName?: string,
  ): Promise<SessionRecord> {
    const userId = normalizeDocument(document);
    if (userId.length !== 11) {
      throw new BadRequestException('CPF inválido');
    }
    return this.persistNewUser({
      document,
      password,
      displayName: displayName || 'Pendente Didit',
      email: `${userId}@didit.pending.regenera`,
      phone: '00000000000',
      birthDate: DIDIT_PROFILE_PLACEHOLDER_BIRTH,
      address: diditPendingAddress(),
    });
  }

  private async persistNewUser(input: {
    document: string;
    password: string;
    displayName: string;
    email: string;
    phone: string;
    birthDate: string;
    address: AddressRecord;
  }): Promise<SessionRecord> {
    const userId = normalizeDocument(input.document);
    if (await this.identity.customerExists(userId)) {
      throw new ConflictException('CPF já cadastrado');
    }
    const user: UserRecord = {
      userId,
      document: input.document,
      password: hashPassword(input.password),
      displayName: input.displayName,
      email: input.email,
      phone: input.phone,
      birthDate: input.birthDate,
      address: input.address,
      createdAt: new Date().toISOString(),
    };
    const session = this.buildSession(user);
    await this.identity.registerUserWithSession(user, session);
    return session;
  }

  async createSession(
    document: string,
    password: string,
    channel: 'WEB' | 'ANDROID' | 'IOS' | 'DESKTOP' | 'PWA' = 'WEB',
    deviceFingerprint?: string,
  ): Promise<SessionRecord> {
    const doc = document.trim();
    const pwd = password.trim();
    if (!doc || !pwd) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const userId = normalizeDocument(doc);
    const user =
      (await this.identity.findUserWithPassword(userId)) ??
      this.identity.get().users[userId];
    if (!user) {
      throw new UnauthorizedException('Conta não encontrada — cadastre-se primeiro');
    }
    if (!verifyPassword(pwd, user.password)) {
      throw new UnauthorizedException('Senha incorreta');
    }
    if (!isPasswordHashed(user.password)) {
      this.identity.mutate((draft) => {
        const stored = draft.users[userId];
        if (stored) {
          stored.password = hashPassword(pwd);
        }
      });
    }
    const session = this.buildSession(user);
    await this.identity.persistSession(session, channel, deviceFingerprint);
    return session;
  }

  isHomologSessionToken(token: string | undefined): boolean {
    return Boolean(token?.startsWith('homolog-'));
  }

  async revokeSession(token: string): Promise<void> {
    if (!token) {
      return;
    }
    if (this.identity.isMemoryMode()) {
      this.identity.mutate((draft) => {
        delete draft.sessions[token];
      });
      return;
    }
    await this.identity.revokeSessionInStore(token);
    this.identity.mutate((draft) => {
      delete draft.sessions[token];
    });
  }

  revokeAllSessionsForUser(userId: string): number {
    let revoked = 0;
    this.identity.mutate((draft) => {
      for (const [token, session] of Object.entries(draft.sessions)) {
        if (session.userId === userId) {
          delete draft.sessions[token];
          revoked += 1;
        }
      }
    });
    return revoked;
  }

  async resolveSession(token: string | undefined): Promise<SessionRecord> {
    if (!token) {
      throw new UnauthorizedException('Sessão ausente');
    }
    if (!this.isHomologSessionToken(token)) {
      throw new UnauthorizedException('Sessão homolog inválida');
    }
    const record =
      (await this.identity.resolveSessionFromStore(token)) ??
      this.identity.get().sessions[token];
    if (!record) {
      throw new UnauthorizedException('Sessão inválida');
    }
    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      this.identity.mutate((draft) => {
        delete draft.sessions[token];
      });
      throw new UnauthorizedException('Sessão expirada');
    }
    return record;
  }

  findUserByFirebaseUid(uid: string): UserRecord | undefined {
    const snapshot = this.identity.get();
    return Object.values(snapshot.users).find(
      (user) => user.firebaseUid === uid || user.userId === uid,
    );
  }

  registerFirebaseUser(
    uid: string,
    email: string,
    input: ProfileUpdateInput,
  ): UserRecord {
    const doc = input.document.trim();
    const name = input.displayName.trim();
    const normalizedEmail = input.email.trim().toLowerCase() || email.trim().toLowerCase();
    const phone = normalizePhone(input.phone);
    const birthDate = input.birthDate.trim();
    if (!doc || !name || !normalizedEmail || !phone || !birthDate) {
      throw new UnauthorizedException(
        'Preencha CPF, nome, e-mail, telefone e data de nascimento',
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      throw new UnauthorizedException(
        'Data de nascimento inválida — use AAAA-MM-DD',
      );
    }
    const documentId = normalizeDocument(doc);
    const existingUid = this.findUserByFirebaseUid(uid);
    if (existingUid && AuthService.isProfileComplete(existingUid)) {
      return existingUid;
    }
    const existingDoc = this.findUserByDocument(doc);
    if (existingDoc && existingDoc.firebaseUid && existingDoc.firebaseUid !== uid) {
      throw new ConflictException('CPF já vinculado a outra conta Firebase');
    }
    const user: UserRecord = {
      userId: uid,
      document: doc,
      password: '',
      displayName: name,
      email: normalizedEmail,
      phone,
      birthDate,
      address: input.address,
      createdAt: existingUid?.createdAt ?? new Date().toISOString(),
      firebaseUid: uid,
    };
    this.identity.mutate((draft) => {
      draft.users[uid] = user;
      if (documentId !== uid) {
        draft.users[documentId] = user;
      }
    });
    return user;
  }

  static isProfileComplete(user: UserRecord): boolean {
    const doc = user.document?.replace(/\D/g, '') ?? '';
    if (isDiditKycProvider()) {
      return doc.length === 11;
    }
    const phone = user.phone?.replace(/\D/g, '') ?? '';
    const cep = user.address?.postalCode?.replace(/\D/g, '') ?? '';
    const birthDate = AuthService.normalizeBirthDate(user.birthDate);
    return (
      doc.length === 11 &&
      /^\d{4}-\d{2}-\d{2}$/.test(birthDate) &&
      phone.length >= 10 &&
      cep.length === 8 &&
      Boolean(user.address.street?.trim()) &&
      Boolean(user.address.number?.trim()) &&
      Boolean(user.address.city?.trim()) &&
      Boolean(user.address.state?.trim())
    );
  }

  static isDiditPlaceholderProfile(user: UserRecord): boolean {
    return (
      user.email?.endsWith('@didit.pending.regenera') === true ||
      user.birthDate === DIDIT_PROFILE_PLACEHOLDER_BIRTH
    );
  }

  updateUserProfile(userId: string, input: ProfileUpdateInput): UserRecord {
    const user = this.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    const doc = input.document.trim();
    const name = input.displayName.trim();
    const email = input.email.trim().toLowerCase();
    const phone = normalizePhone(input.phone);
    const birthDate = input.birthDate.trim();
    if (!doc || !name || !email || !phone || !birthDate) {
      throw new UnauthorizedException(
        'Preencha CPF, nome, e-mail, telefone e data de nascimento',
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      throw new UnauthorizedException(
        'Data de nascimento inválida — use AAAA-MM-DD',
      );
    }
    const documentId = normalizeDocument(doc);
    const ownerUid = user.firebaseUid ?? user.userId;
    const existingDoc = this.findUserByDocument(doc);
    if (
      existingDoc &&
      (existingDoc.firebaseUid ?? existingDoc.userId) !== ownerUid
    ) {
      throw new ConflictException('CPF já vinculado a outra conta');
    }
    const updated: UserRecord = {
      ...user,
      document: doc,
      displayName: name,
      email,
      phone,
      birthDate,
      address: input.address,
      firebaseUid: user.firebaseUid ?? user.userId,
    };
    this.identity.mutate((draft) => {
      draft.users[userId] = updated;
      if (documentId !== userId) {
        draft.users[documentId] = updated;
      }
    });
    return updated;
  }

  syncFirebaseUser(uid: string, email: string, displayName?: string): UserRecord {
    const existing = this.findUserByFirebaseUid(uid);
    if (existing) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail && existing.email !== normalizedEmail) {
        const updated: UserRecord = { ...existing, email: normalizedEmail };
        this.identity.mutate((draft) => {
          draft.users[existing.userId] = updated;
          const docKey = normalizeDocument(existing.document);
          if (docKey && docKey !== existing.userId) {
            draft.users[docKey] = updated;
          }
        });
        return updated;
      }
      return existing;
    }
    const user: UserRecord = {
      userId: uid,
      document: '',
      password: '',
      displayName: displayName?.trim() || email.split('@')[0] || 'Cliente',
      email: email.trim().toLowerCase(),
      phone: '',
      address: {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        postalCode: '',
      },
      createdAt: new Date().toISOString(),
      firebaseUid: uid,
    };
    this.identity.mutate((draft) => {
      draft.users[uid] = user;
    });
    return user;
  }

  getUserDisplayName(userId: string): string | undefined {
    return this.identity.get().users[userId]?.displayName;
  }

  getUserEmail(userId: string): string | undefined {
    return this.identity.get().users[userId]?.email;
  }

  getUserPhone(userId: string): string | undefined {
    return this.identity.get().users[userId]?.phone;
  }

  findUserIdByDocument(document: string): string | undefined {
    const userId = normalizeDocument(document);
    return this.identity.get().users[userId] ? userId : undefined;
  }

  resolveUserId(document: string): string | undefined {
    return this.findUserIdByDocument(document);
  }

  findUserByDocument(document: string): UserRecord | undefined {
    const userId = normalizeDocument(document.trim());
    const direct = this.identity.get().users[userId];
    if (direct) {
      return direct;
    }
    return Object.values(this.identity.get().users).find(
      (user) => normalizeDocument(user.document) === userId,
    );
  }

  findUserById(userId: string): UserRecord | undefined {
    return this.identity.get().users[userId];
  }

  verifyUserPassword(document: string, password: string): UserRecord {
    const doc = document.trim();
    const pwd = password.trim();
    if (!doc || !pwd) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const user = this.identity.get().users[normalizeDocument(doc)];
    if (!user) {
      throw new UnauthorizedException('Conta não encontrada — cadastre-se primeiro');
    }
    if (!verifyPassword(pwd, user.password)) {
      throw new UnauthorizedException('Senha incorreta');
    }
    return user;
  }

  issueSessionForUser(user: UserRecord): SessionRecord {
    const session = this.buildSession(user);
    this.identity.mutate((draft) => {
      draft.sessions[session.accessToken] = session;
    });
    return session;
  }

  requestPasswordReset(document: string): PasswordResetRequestResult {
    const doc = document.trim();
    const docKey = normalizeDocument(doc);
    const neutralMessage =
      'Se o CPF estiver cadastrado, enviaremos instruções de recuperação.';

    this.enforcePasswordResetRateLimit(docKey);

    const user = doc ? this.findUserByDocument(doc) : undefined;
    if (!user || !user.password || user.firebaseUid) {
      this.appendPasswordResetAudit({
        action: 'request',
        documentHash: hashDocumentForAudit(doc || 'empty'),
        reason: user?.firebaseUid ? 'firebase_account' : 'not_found_or_no_password',
      });
      return { acknowledged: true, message: neutralMessage };
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);
    const now = Date.now();
    const record = {
      tokenHash,
      userId: user.userId,
      expiresAt: new Date(now + PASSWORD_RESET_TTL_MS).toISOString(),
      createdAt: new Date(now).toISOString(),
    };

    this.identity.mutate((draft) => {
      draft.passwordResetTokens ??= {};
      draft.passwordResetActiveByUserId ??= {};
      draft.passwordResetAudit ??= [];

      const previousHash = draft.passwordResetActiveByUserId[user.userId];
      if (previousHash && draft.passwordResetTokens[previousHash]) {
        delete draft.passwordResetTokens[previousHash];
      }

      draft.passwordResetTokens[tokenHash] = record;
      draft.passwordResetActiveByUserId[user.userId] = tokenHash;
      draft.passwordResetAudit.push({
        action: 'request',
        userId: user.userId,
        documentHash: hashDocumentForAudit(doc),
        at: new Date(now).toISOString(),
      });
    });

    const exposeDevToken =
      process.env.NODE_ENV === 'test' ||
      (process.env.NODE_ENV !== 'production' &&
        process.env.HOMOLOG_EXPOSE_PASSWORD_RESET_TOKEN !== 'false');

    return {
      acknowledged: true,
      message: neutralMessage,
      ...(exposeDevToken ? { devToken: rawToken } : {}),
    };
  }

  confirmPasswordReset(token: string, newPassword: string): void {
    const trimmedToken = token.trim();
    const pwd = newPassword.trim();
    if (!trimmedToken || !pwd) {
      throw new BadRequestException('Token e nova senha são obrigatórios');
    }
    if (pwd.length < PASSWORD_RESET_MIN_LENGTH) {
      throw new BadRequestException(
        `Senha deve ter no mínimo ${PASSWORD_RESET_MIN_LENGTH} caracteres`,
      );
    }

    const tokenHash = hashToken(trimmedToken);
    const snapshot = this.identity.get();
    const tokens = snapshot.passwordResetTokens ?? {};
    const record = tokens[tokenHash];
    if (!record) {
      this.appendPasswordResetAudit({
        action: 'reject',
        documentHash: 'unknown',
        reason: 'invalid_token',
      });
      throw new UnauthorizedException('Token inválido ou expirado');
    }
    if (record.usedAt) {
      this.appendPasswordResetAudit({
        action: 'reject',
        userId: record.userId,
        documentHash: 'unknown',
        reason: 'token_reused',
      });
      throw new UnauthorizedException('Token já utilizado');
    }
    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      this.appendPasswordResetAudit({
        action: 'reject',
        userId: record.userId,
        documentHash: 'unknown',
        reason: 'token_expired',
      });
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const user = this.findUserById(record.userId);
    if (!user) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    this.identity.mutate((draft) => {
      const stored = draft.users[record.userId];
      if (!stored) {
        return;
      }
      stored.password = hashPassword(pwd);

      draft.passwordResetTokens ??= {};
      const active = draft.passwordResetTokens[tokenHash];
      if (active) {
        active.usedAt = new Date().toISOString();
      }

      for (const [hash, entry] of Object.entries(draft.passwordResetTokens)) {
        if (entry.userId === record.userId && hash !== tokenHash) {
          delete draft.passwordResetTokens[hash];
        }
      }

      if (draft.passwordResetActiveByUserId) {
        delete draft.passwordResetActiveByUserId[record.userId];
      }

      for (const sessionToken of Object.keys(draft.sessions)) {
        if (draft.sessions[sessionToken]?.userId === record.userId) {
          delete draft.sessions[sessionToken];
        }
      }

      draft.passwordResetAudit ??= [];
      draft.passwordResetAudit.push({
        action: 'confirm',
        userId: record.userId,
        documentHash: hashDocumentForAudit(stored.document),
        at: new Date().toISOString(),
      });
    });
  }

  private enforcePasswordResetRateLimit(docKey: string): void {
    const now = Date.now();
    this.identity.mutate((draft) => {
      draft.passwordResetRateLimits ??= {};
      const current = draft.passwordResetRateLimits[docKey];
      if (!current) {
        draft.passwordResetRateLimits[docKey] = {
          count: 1,
          windowStartedAt: new Date(now).toISOString(),
        };
        return;
      }
      const windowStart = new Date(current.windowStartedAt).getTime();
      if (now - windowStart > PASSWORD_RESET_RATE_WINDOW_MS) {
        draft.passwordResetRateLimits[docKey] = {
          count: 1,
          windowStartedAt: new Date(now).toISOString(),
        };
        return;
      }
      if (current.count >= PASSWORD_RESET_RATE_MAX) {
        throw new HttpException(
          'Muitas tentativas — aguarde antes de solicitar novamente',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      current.count += 1;
    });
  }

  private appendPasswordResetAudit(
    entry: Omit<PasswordResetAuditRecord, 'at'>,
  ): void {
    this.identity.mutate((draft) => {
      draft.passwordResetAudit ??= [];
      draft.passwordResetAudit.push({
        ...entry,
        at: new Date().toISOString(),
      });
    });
  }

  /** PG DATE pode chegar como Date após cold start — evita 500 em isProfileComplete. */
  static normalizeBirthDate(value: unknown): string {
    if (value == null) {
      return '';
    }
    if (typeof value === 'string') {
      return value.trim().slice(0, 10);
    }
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).trim().slice(0, 10);
  }

  async refreshSession(refreshToken: string): Promise<SessionRecord> {
    const current = await this.identity.refreshSession(refreshToken);
    if (!current) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
    const user = this.findUserById(current.userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    const next = this.buildSession(user);
    await this.identity.rotateSession(current.accessToken, next);
    return next;
  }

  private buildSession(user: UserRecord): SessionRecord {
    const accessTtlMs = 15 * 60 * 1000;
    const refreshTtlMs = 7 * 24 * 60 * 60 * 1000;
    return {
      accessToken: `homolog-${randomUUID()}`,
      refreshToken: `refresh-${randomUUID()}`,
      userId: user.userId,
      displayName: user.displayName,
      expiresAt: new Date(Date.now() + accessTtlMs).toISOString(),
      refreshExpiresAt: new Date(Date.now() + refreshTtlMs).toISOString(),
    };
  }
}