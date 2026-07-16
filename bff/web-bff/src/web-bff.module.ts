import { Module } from '@nestjs/common';
import { CoreBankModule } from './integrations/core-bank';
import { PersistenceModule } from './persistence/persistence.module';
import { AuthModule } from './auth/auth.module';
import { BankingModule } from './banking/banking.module';
import { ProductsModule } from './products/products.module';
import { LifestyleModule } from './lifestyle/lifestyle.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AddressModule } from './address/address.module';
import { AssistantModule } from './assistant/assistant.module';
import { ConsentModule } from './consent/consent.module';
import { BaselineModule } from './baseline/baseline.module';
import { JourneyModule } from './journey/journey.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    PersistenceModule,
    CoreBankModule.forRoot(),
    AuthModule,
    ConsentModule,
    OnboardingModule,
    JourneyModule,
    AddressModule,
    BankingModule,
    ProductsModule,
    LifestyleModule,
    AssistantModule,
    BaselineModule,
  ],
  controllers: [HealthController],
})
export class WebBffModule {}