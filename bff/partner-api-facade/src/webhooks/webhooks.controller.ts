import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PartnerAuthGuard } from '../auth/partner-auth.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import type { PartnerPrincipal } from '../auth/principal.types';
import { WebhooksService } from './webhooks.service';

type AuthedRequest = Request & { principal: PartnerPrincipal };

@Controller('webhooks')
@UseGuards(PartnerAuthGuard, ScopesGuard)
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Get('subscriptions')
  @RequireScopes('webhooks:read')
  list(@Req() req: AuthedRequest) {
    return this.webhooks.list(req.principal.clientId);
  }

  @Post('subscriptions')
  @RequireScopes('webhooks:write')
  register(
    @Req() req: AuthedRequest,
    @Body() body: { url: string; events: string[]; secret?: string },
  ) {
    return this.webhooks.register(req.principal.clientId, body);
  }

  @Delete('subscriptions/:subscriptionId')
  @RequireScopes('webhooks:write')
  delete(@Req() req: AuthedRequest, @Param('subscriptionId') subscriptionId: string) {
    this.webhooks.delete(req.principal.clientId, subscriptionId);
    return;
  }
}