import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PartnerAuthGuard } from '../auth/partner-auth.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import type { PartnerPrincipal } from '../auth/principal.types';
import { SandboxKeysService } from './sandbox-keys.service';
import { WebhooksService } from '../webhooks/webhooks.service';

type AuthedRequest = Request & { principal: PartnerPrincipal };

@Controller('sandbox')
@UseGuards(PartnerAuthGuard, ScopesGuard)
export class SandboxController {
  constructor(
    private readonly keys: SandboxKeysService,
    private readonly webhooks: WebhooksService,
  ) {}

  @Get('keys')
  @RequireScopes('sandbox:admin')
  listKeys() {
    return this.keys.list();
  }

  @Post('keys')
  @RequireScopes('sandbox:admin')
  createKey(@Body() body: { name: string; scopes: string[] }) {
    const created = this.keys.create(body);
    return {
      id: created.id,
      name: created.name,
      clientId: created.clientId,
      clientSecret: created.clientSecret,
      scopes: created.scopes,
      createdAt: created.createdAt,
    };
  }

  @Post('webhooks/test')
  @RequireScopes('sandbox:admin')
  testWebhook(
    @Req() req: AuthedRequest,
    @Body() body: { subscriptionId: string; eventType: string; payload?: Record<string, unknown> },
  ) {
    return this.webhooks.testDelivery(req.principal.clientId, body);
  }
}