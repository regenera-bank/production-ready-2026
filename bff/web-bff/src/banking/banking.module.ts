import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CoreBankModule } from '../integrations/core-bank';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    CoreBankModule.forRoot(),
    forwardRef(() => OnboardingModule),
  ],
  controllers: [BankingController],
  providers: [BankingService],
  exports: [BankingService],
})
export class BankingModule {}