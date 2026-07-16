export { ChannelPersistenceModule } from './channel-persistence.module';
export { ChannelIdentityService } from './identity/channel-identity.service';
export { ChannelJourneyService } from './journey/channel-journey.service';
export { DocumentAssetService } from './journey/document-asset.service';
export { TransactionProjectionService } from './projections/transaction-projection.service';
export { ChannelBankingService } from './banking/channel-banking.service';
export { ChannelAncillaryService } from './ancillary/channel-ancillary.service';
export type {
  ConsentRecord,
  ConsentType,
  ConsentChannel,
  StoredPasskeyRecord,
} from './ancillary/channel-ancillary.types';
export type { BankingSnapshot, PixDirectoryRecord } from './banking/channel-banking.types';
export type {
  PaymentSettledOutboxEvent,
  TransactionProjectionRecord,
} from './projections/transaction-projection.types';
export type {
  JourneyRecord as ChannelJourneyRecord,
  OnboardingRecord as ChannelOnboardingRecord,
  JourneySnapshot,
} from './journey/channel-journey.types';
export type {
  AddressRecord,
  IdentitySnapshot,
  PasswordResetAuditRecord,
  PasswordResetRateLimitRecord,
  PasswordResetTokenRecord,
  SessionRecord,
  UserRecord,
} from './identity/channel-identity.types';
export { runChannelMigrations } from './db/migration-runner';
export {
  createChannelPostgresPool,
  getChannelPostgresPool,
} from './db/postgres-pool';