import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CoreBankModule } from '../integrations/core-bank';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { PaymentSettlementPublisher } from '../projections/payment-settlement.publisher';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    CoreBankModule.forRoot(),
    forwardRef(() => OnboardingModule),
  ],
  controllers: [BankingController],
  providers: [BankingService, PaymentSettlementPublisher],
  exports: [BankingService],
})
export class BankingModule {}