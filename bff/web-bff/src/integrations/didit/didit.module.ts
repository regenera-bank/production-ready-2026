import { Module, forwardRef } from '@nestjs/common';
import { OnboardingModule } from '../../onboarding/onboarding.module';
import { DiditClient } from './didit.client';
import { DiditOnboardingService } from './didit-onboarding.service';
import { DiditWebhookController } from './didit-webhook.controller';
import { DiditWebhookVerifier } from './didit-webhook-verifier';

@Module({
  imports: [forwardRef(() => OnboardingModule)],
  controllers: [DiditWebhookController],
  providers: [DiditClient, DiditWebhookVerifier, DiditOnboardingService],
  exports: [DiditClient, DiditWebhookVerifier, DiditOnboardingService],
})
export class DiditModule {}