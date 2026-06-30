import { Module } from '@nestjs/common';
import { CoreBankModule } from './integrations/core-bank';
import { PersistenceModule } from './persistence/persistence.module';
import { AuthModule } from './auth/auth.module';
import { BankingModule } from './banking/banking.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AddressModule } from './address/address.module';
import { AiModule } from './ai/ai.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    PersistenceModule,
    CoreBankModule,
    AuthModule,
    OnboardingModule,
    AddressModule,
    BankingModule,
    AiModule,
  ],
  controllers: [HealthController],
})
export class WebBffModule {}