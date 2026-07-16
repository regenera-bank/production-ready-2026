import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { SessionRecord } from '../auth/auth.service';
import type { ConsentType } from '@regenera/channel-persistence';
import { ConsentService } from './consent.service';
import type { AcceptConsentInput } from './consent.types';

type AuthedRequest = Request & { session: SessionRecord };

@Controller('consents')
export class ConsentController {
  constructor(private readonly consents: ConsentService) {}

  @Get('status')
  @UseGuards(SessionGuard)
  status(@Req() req: AuthedRequest) {
    return this.consents.status(req.session.userId);
  }

  @Post('accept')
  @UseGuards(SessionGuard)
  async accept(@Req() req: AuthedRequest, @Body() body: AcceptConsentInput) {
    return this.consents.accept(req.session.userId, body);
  }

  @Post('revoke')
  @UseGuards(SessionGuard)
  async revoke(@Req() req: AuthedRequest, @Body() body: { type: ConsentType }) {
    await this.consents.revoke(req.session.userId, body.type);
    return { ok: true };
  }
}