import { Module } from '@nestjs/common';
import { AddressModule } from '../../address/address.module';
import { DataValidClient } from './datavalid.client';
import { createTestVisionAdapter } from './test-vision.mock';
import { ResilientVisionAdapter } from './resilient-vision.adapter';
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
      useFactory: () => {
        const sandbox = createTestVisionAdapter();
        if (process.env.E2E_VISION_STUB === 'true') {
          return sandbox;
        }
        const provider = process.env.KYC_PROVIDER?.trim().toLowerCase();
        const homologKyc = provider === 'firebase' || provider === 'homolog';
        const isProduction =
          process.env.NODE_ENV?.trim().toLowerCase() === 'production';
        // Homolog local: Vision Auditável sem depender de OCR GCP em foto de celular.
        if (homologKyc && !isProduction) {
          return new ResilientVisionAdapter(sandbox, sandbox);
        }
        return new ResilientVisionAdapter(new GcpVisionAdapter(), sandbox);
      },
    },
  ],
  exports: [RiskKycOrchestrator, KycEngineService, PrometeoIdentityClient],
})
export class RiskKycModule {}