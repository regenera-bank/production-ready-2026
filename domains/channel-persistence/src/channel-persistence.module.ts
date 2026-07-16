import { DynamicModule, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { ChannelPersistenceBootstrap } from './channel-persistence.bootstrap';
import { createChannelPostgresPool } from './db/postgres-pool';
import { ChannelJourneyService } from './journey/channel-journey.service';
import { DocumentAssetService } from './journey/document-asset.service';
import { ChannelIdentityService } from './identity/channel-identity.service';
import { TransactionProjectionService } from './projections/transaction-projection.service';
import { ChannelBankingService } from './banking/channel-banking.service';
import { ChannelAncillaryService } from './ancillary/channel-ancillary.service';

export const CHANNEL_PG_POOL = Symbol('CHANNEL_PG_POOL');

@Module({})
export class ChannelPersistenceModule {
  static forRoot(): DynamicModule {
    const mode = (process.env.CHANNEL_PERSISTENCE ?? 'memory').trim().toLowerCase();
    const usePostgres =
      mode === 'postgres' &&
      process.env.NODE_ENV !== 'test' &&
      process.env.CHANNEL_IDENTITY_MEMORY !== 'true';

    const providers: DynamicModule['providers'] = [
      ChannelIdentityService,
      ChannelJourneyService,
      DocumentAssetService,
      TransactionProjectionService,
      ChannelBankingService,
      ChannelAncillaryService,
      ChannelPersistenceBootstrap,
    ];

    if (usePostgres) {
      providers.push({
        provide: CHANNEL_PG_POOL,
        useFactory: () => createChannelPostgresPool(),
      });
      providers.push({
        provide: Pool,
        useExisting: CHANNEL_PG_POOL,
      });
    }

    return {
      module: ChannelPersistenceModule,
      global: true,
      providers,
      exports: [
        ChannelIdentityService,
        ChannelJourneyService,
        DocumentAssetService,
        TransactionProjectionService,
        ChannelBankingService,
        ChannelAncillaryService,
      ],
    };
  }
}