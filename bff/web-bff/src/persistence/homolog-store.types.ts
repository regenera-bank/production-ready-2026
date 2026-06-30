import type { SessionRecord, UserRecord } from '../auth/auth.service';
import type { PixKeyItem, TransactionItem } from '../banking/banking.dto';
import type { MonitoredPaymentRecord } from '../integrations/prometeo-payments/prometeo-payments.types';
import type { OnboardingRecord } from '../onboarding/onboarding.types';

export interface StoredPasskeyRecord {
  readonly credentialId: string;
  readonly publicKeyBase64: string;
  counter: number;
  readonly transports?: string[];
}

export interface PixDirectoryRecord {
  readonly userId: string;
  readonly displayName: string;
  readonly accountId: string;
  readonly keyType: string;
  readonly rawKey: string;
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

export interface HomologSnapshot {
  readonly version: 1;
  users: Record<string, UserRecord>;
  sessions: Record<string, SessionRecord>;
  passkeys: Record<string, StoredPasskeyRecord[]>;
  passwordResetTokens?: Record<string, PasswordResetTokenRecord>;
  passwordResetActiveByUserId?: Record<string, string>;
  passwordResetRateLimits?: Record<string, PasswordResetRateLimitRecord>;
  passwordResetAudit?: PasswordResetAuditRecord[];
  onboarding: Record<string, OnboardingRecord>;
  banking: {
    accountsByUser: Record<string, string>;
    balanceCentsByUser: Record<string, string>;
    transactionsByUser: Record<string, TransactionItem[]>;
    pixKeysByUser: Record<string, PixKeyItem[]>;
    pixDirectory: Record<string, PixDirectoryRecord>;
    /** userIds que já receberam crédito homolog de abertura */
    welcomeCreditGrantedUserIds?: Record<string, true>;
    /** contador global de contas que receberam o crédito (máx. 30) */
    welcomeCreditAccountsOpened?: number;
  };
  prometeoPayments?: Record<string, MonitoredPaymentRecord>;
  prometeoProcessedEventIds?: Record<string, string>;
}

export const emptyHomologSnapshot = (): HomologSnapshot => ({
  version: 1,
  users: {},
  sessions: {},
  passkeys: {},
  passwordResetTokens: {},
  passwordResetActiveByUserId: {},
  passwordResetRateLimits: {},
  passwordResetAudit: [],
  onboarding: {},
  banking: {
    accountsByUser: {},
    balanceCentsByUser: {},
    transactionsByUser: {},
    pixKeysByUser: {},
    pixDirectory: {},
    welcomeCreditGrantedUserIds: {},
    welcomeCreditAccountsOpened: 0,
  },
  prometeoPayments: {},
  prometeoProcessedEventIds: {},
});