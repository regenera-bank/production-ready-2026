export interface AddressRecord {
  readonly street: string;
  readonly number: string;
  readonly complement?: string;
  readonly neighborhood: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
}

export interface SessionRecord {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly userId: string;
  readonly displayName: string;
  readonly expiresAt: string;
  readonly refreshExpiresAt?: string;
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

export interface PasswordResetTokenRecord {
  readonly tokenHash: string;
  readonly userId: string;
  readonly expiresAt: string;
  readonly createdAt: string;
  usedAt?: string;
}

export interface PasswordResetRateLimitRecord {
  count: number;
  readonly windowStartedAt: string;
}

export interface PasswordResetAuditRecord {
  readonly action: 'request' | 'confirm' | 'reject';
  readonly userId?: string;
  readonly documentHash: string;
  readonly reason?: string;
  readonly at: string;
}

export interface IdentitySnapshot {
  users: Record<string, UserRecord>;
  sessions: Record<string, SessionRecord>;
  passwordResetTokens: Record<string, PasswordResetTokenRecord>;
  passwordResetActiveByUserId: Record<string, string>;
  passwordResetRateLimits: Record<string, PasswordResetRateLimitRecord>;
  passwordResetAudit: PasswordResetAuditRecord[];
}

export function emptyIdentitySnapshot(): IdentitySnapshot {
  return {
    users: {},
    sessions: {},
    passwordResetTokens: {},
    passwordResetActiveByUserId: {},
    passwordResetRateLimits: {},
    passwordResetAudit: [],
  };
}