import {
  ChannelAncillaryService,
  ChannelBankingService,
  ChannelIdentityService,
  ChannelJourneyService,
  DocumentAssetService,
  TransactionProjectionService,
} from '@regenera/channel-persistence';
import type { TestingModule } from '@nestjs/testing';

export const testPersistenceProviders = [
  ChannelIdentityService,
  ChannelJourneyService,
  ChannelBankingService,
  ChannelAncillaryService,
  DocumentAssetService,
  TransactionProjectionService,
] as const;

export async function initTestPersistence(moduleRef: TestingModule): Promise<{
  identity: ChannelIdentityService;
  journey: ChannelJourneyService;
  documents: DocumentAssetService;
  projections: TransactionProjectionService;
  banking: ChannelBankingService;
  ancillary: ChannelAncillaryService;
}> {
  process.env.CHANNEL_IDENTITY_MEMORY = 'true';
  const identity = moduleRef.get(ChannelIdentityService);
  identity.onModuleInit();
  const journey = moduleRef.get(ChannelJourneyService);
  journey.onModuleInit();
  const documents = moduleRef.get(DocumentAssetService);
  documents.reset();
  const projections = moduleRef.get(TransactionProjectionService);
  projections.onModuleInit();
  projections.reset();
  const banking = moduleRef.get(ChannelBankingService);
  banking.onModuleInit();
  banking.reset();
  const ancillary = moduleRef.get(ChannelAncillaryService);
  ancillary.onModuleInit();
  ancillary.reset();
  return { identity, journey, documents, projections, banking, ancillary };
}