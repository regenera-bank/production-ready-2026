import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BankingModule } from '../banking/banking.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { ChannelController } from './channel.controller';
import { JourneyController } from './journey.controller';
import { JourneyService } from './journey.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => BankingModule),
    forwardRef(() => OnboardingModule),
  ],
  controllers: [JourneyController, ChannelController],
  providers: [JourneyService],
  exports: [JourneyService],
})
export class JourneyModule {}