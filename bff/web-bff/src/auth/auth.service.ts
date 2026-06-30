import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
import type { AddressRecord } from '../onboarding/onboarding.types';
import { HomologStoreService } from '../persistence/homolog-store.service';
import type { PasswordResetAuditRecord } from '../persistence/homolog-store.types';
import {
  hashPassword,
  isPasswordHashed,
  verifyPassword,
} from './password-hash';

export interface SessionRecord {
  readonly accessToken: string;
  readonly userId: string;
  readonly displayName: string;
  readonly expiresAt: string;
}

export interface UserRecord {
  readonly userId: string;
  readonly document: string;
  password: string;
  readonly displayName: string;
  readonly email: string;
  readonly phone: string;
  readonly birthDate?: string;
  readonly address: AddressRecord;
  readonly createdAt: string;
  readonly firebaseUid?: string;
}

export interface RegisterInput {
  readonly document: string;
  readonly password: string;
  readonly displayName: string;
  readonly email: string;
  readonly phone: string;
  readonly birthDate: string;
  readonly address: AddressRecord;
}

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
  constructor(private readonly store: HomologStoreService) {}

  register(input: RegisterInput): SessionRecord {
    const doc = input.document.trim();
    const pwd = input.password.trim();
    const name = input.displayName.trim();
    const email = input.email.trim().toLowerCase();
    const phone = normalizePhone(input.phone);
    const birthDate = input.birthDate.trim();
    if (!doc || !pwd || !name || !email || !phone || !birthDate) {
      throw new UnauthorizedException(
        'Preencha CPF, senha, nome, e-mail, telefone e data de nascimento',
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      throw new UnauthorizedException(
        'Data de nascimento inválida — use AAAA-MM-DD',
      );
    }
    const userId = normalizeDocument(doc);
    const snapshot = this.store.get();
    if (snapshot.users[userId]) {
      throw new ConflictException('CPF já cadastrado');
    }
    const user: UserRecord = {
      userId,
      document: doc,
      password: hashPassword(pwd),
      displayName: name,
      email,
      phone,
      birthDate,
      address: input.address,
      createdAt: new Date().toISOString(),
    };
    const session = this.buildSession(user);
    this.store.mutate((draft) => {
      draft.users[userId] = user;
      draft.sessions[session.accessToken] = session;
    });
    return session;
  }

  createSession(document: string, password: string): SessionRecord {
    const doc = document.trim();
    const pwd = password.trim();
    if (!doc || !pwd) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const userId = normalizeDocument(doc);
    const user = this.store.get().users[userId];
    if (!user) {
      throw new UnauthorizedException('Conta não encontrada — cadastre-se primeiro');
    }
    if (!verifyPassword(pwd, user.password)) {
      throw new UnauthorizedException('Senha incorreta');
    }
    if (!isPasswordHashed(user.password)) {
      this.store.mutate((draft) => {
        const stored = draft.users[userId];
        if (stored) {
          stored.password = hashPassword(pwd);
        }
      });
    }
    const session = this.buildSession(user);
    this.store.mutate((draft) => {
      draft.sessions[session.accessToken] = session;
    });
    return session;
  }

  isHomologSessionToken(token: string | undefined): boolean {
    return Boolean(token?.startsWith('homolog-'));
  }

  resolveSession(token: string | undefined): SessionRecord {
    if (!token) {
      throw new UnauthorizedException('Sessão ausente');
    }
    if (!this.isHomologSessionToken(token)) {
      throw new UnauthorizedException('Sessão homolog inválida');
    }
    const record = this.store.get().sessions[token];
    if (!record) {
      throw new UnauthorizedException('Sessão inválida');
    }
    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      this.store.mutate((draft) => {
        delete draft.sessions[token];
      });
      throw new UnauthorizedException('Sessão expirada');
    }
    return record;
  }

  findUserByFirebaseUid(uid: string): UserRecord | undefined {
    const snapshot = this.store.get();
    return Object.values(snapshot.users).find(
      (user) => user.firebaseUid === uid || user.userId === uid,
    );
  }

  registerFirebaseUser(
    uid: string,
    email: string,
    input: RegisterInput,
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
    this.store.mutate((draft) => {
      draft.users[uid] = user;
      if (documentId !== uid) {
        draft.users[documentId] = user;
      }
    });
    return user;
  }

  static isProfileComplete(user: UserRecord): boolean {
    const doc = user.document?.replace(/\D/g, '') ?? '';
    const phone = user.phone?.replace(/\D/g, '') ?? '';
    const cep = user.address?.postalCode?.replace(/\D/g, '') ?? '';
    const birthDate = user.birthDate?.trim() ?? '';
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

  updateUserProfile(
    userId: string,
    input: Omit<RegisterInput, 'password'>,
  ): UserRecord {
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
    this.store.mutate((draft) => {
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
        this.store.mutate((draft) => {
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
    this.store.mutate((draft) => {
      draft.users[uid] = user;
    });
    return user;
  }

  getUserDisplayName(userId: string): string | undefined {
    return this.store.get().users[userId]?.displayName;
  }

  getUserEmail(userId: string): string | undefined {
    return this.store.get().users[userId]?.email;
  }

  getUserPhone(userId: string): string | undefined {
    return this.store.get().users[userId]?.phone;
  }

  findUserIdByDocument(document: string): string | undefined {
    const userId = normalizeDocument(document);
    return this.store.get().users[userId] ? userId : undefined;
  }

  resolveUserId(document: string): string | undefined {
    return this.findUserIdByDocument(document);
  }

  findUserByDocument(document: string): UserRecord | undefined {
    const userId = normalizeDocument(document.trim());
    const direct = this.store.get().users[userId];
    if (direct) {
      return direct;
    }
    return Object.values(this.store.get().users).find(
      (user) => normalizeDocument(user.document) === userId,
    );
  }

  findUserById(userId: string): UserRecord | undefined {
    return this.store.get().users[userId];
  }

  verifyUserPassword(document: string, password: string): UserRecord {
    const doc = document.trim();
    const pwd = password.trim();
    if (!doc || !pwd) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const user = this.store.get().users[normalizeDocument(doc)];
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
    this.store.mutate((draft) => {
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

    this.store.mutate((draft) => {
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
    const snapshot = this.store.get();
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

    this.store.mutate((draft) => {
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
    this.store.mutate((draft) => {
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
    this.store.mutate((draft) => {
      draft.passwordResetAudit ??= [];
      draft.passwordResetAudit.push({
        ...entry,
        at: new Date().toISOString(),
      });
    });
  }

  private buildSession(user: UserRecord): SessionRecord {
    return {
      accessToken: `homolog-${randomUUID()}`,
      userId: user.userId,
      displayName: user.displayName,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    };
  }
}