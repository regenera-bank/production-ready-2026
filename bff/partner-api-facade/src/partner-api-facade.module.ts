import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { OAuthController } from './auth/oauth.controller';
import { OAuthService } from './auth/oauth.service';
import { PartnerController } from './partner/partner.controller';
import { PartnerService } from './partner/partner.service';
import { WebhooksController } from './webhooks/webhooks.controller';
import { WebhooksService } from './webhooks/webhooks.service';
import { SandboxController } from './sandbox/sandbox.controller';
import { SandboxKeysService } from './sandbox/sandbox-keys.service';
import { WebhookAdapterFactory } from './webhooks/adapters/webhook-adapter.factory';
import { PartnerAuthGuard } from './auth/partner-auth.guard';
import { ScopesGuard } from './auth/scopes.guard';

@Module({
  controllers: [
    HealthController,
    OAuthController,
    PartnerController,
    WebhooksController,
    SandboxController,
  ],
  providers: [
    OAuthService,
    PartnerService,
    WebhooksService,
    SandboxKeysService,
    WebhookAdapterFactory,
    PartnerAuthGuard,
    ScopesGuard,
  ],
})
export class PartnerApiFacadeModule {}