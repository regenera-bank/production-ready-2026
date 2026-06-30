import { Module } from '@nestjs/common';
import { AddressModule } from '../../address/address.module';
import { DataValidClient } from './datavalid.client';
import { GcpVisionAdapter } from './vision.adapter';
import { pepProviderFactory } from './pep-provider.factory';
import { PrometeoIdentityClient } from './prometeo-identity.client';
import { HomologKycValidator } from './homolog-kyc.validator';
import { KycEngineService } from './kyc-engine.service';
import { RiskKycOrchestrator } from './risk-kyc.orchestrator';

@Module({
  imports: [AddressModule],
  providers: [
    HomologKycValidator,
    DataValidClient,
    PrometeoIdentityClient,
    KycEngineService,
    RiskKycOrchestrator,
    pepProviderFactory,
    {
      provide: 'VISION_ADAPTER',
      useClass: GcpVisionAdapter,
    },
  ],
  exports: [RiskKycOrchestrator, KycEngineService, PrometeoIdentityClient],
})
export class RiskKycModule {}