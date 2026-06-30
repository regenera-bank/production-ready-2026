import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BankingModule } from '../banking/banking.module';
import { RiskKycModule } from '../integrations/risk-kyc/risk-kyc.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [forwardRef(() => AuthModule), RiskKycModule, forwardRef(() => BankingModule)],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}