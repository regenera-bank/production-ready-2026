import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BankingModule } from '../banking/banking.module';
import { JourneyModule } from '../journey/journey.module';
import { DiditModule } from '../integrations/didit/didit.module';
import { DIDIT_ONBOARDING_REPOSITORY } from '../integrations/didit/didit-onboarding.service';
import { RiskKycModule } from '../integrations/risk-kyc/risk-kyc.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    RiskKycModule,
    forwardRef(() => DiditModule),
    forwardRef(() => BankingModule),
    forwardRef(() => JourneyModule),
  ],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    { provide: DIDIT_ONBOARDING_REPOSITORY, useExisting: OnboardingService },
  ],
  exports: [OnboardingService, DIDIT_ONBOARDING_REPOSITORY],
})
export class OnboardingModule {}