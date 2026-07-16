import { randomUUID } from 'crypto';
import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { SessionRecord } from '../auth/auth.service';
import { LifestyleService } from './lifestyle.service';

type AuthedRequest = Request & { session: SessionRecord };

@Controller('lifestyle')
export class LifestyleController {
  constructor(private readonly lifestyle: LifestyleService) {}

  @Get('modules')
  listModules() {
    return this.lifestyle.listModules();
  }

  @Get(':moduleId/catalog')
  @UseGuards(SessionGuard)
  catalog(@Req() req: AuthedRequest, @Param('moduleId') moduleId: string) {
    return this.lifestyle.getCatalog(req.session.userId, moduleId);
  }

  @Get(':moduleId/activation')
  @UseGuards(SessionGuard)
  activation(@Param('moduleId') moduleId: string) {
    return this.lifestyle.getActivation(moduleId);
  }

  @Post(':moduleId/actions')
  @UseGuards(SessionGuard)
  action(
    @Req() req: AuthedRequest,
    @Param('moduleId') moduleId: string,
    @Body() body: { action: string; payload?: Record<string, unknown> },
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.lifestyle.executeAction(
      req.session.userId,
      moduleId,
      body.action,
      idempotencyKey ?? `lifestyle-${randomUUID()}`,
      body.payload,
    );
  }
}