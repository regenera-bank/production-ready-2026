import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { OAuthService } from './oauth.service';

@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauth: OAuthService) {}

  @Post('token')
  async token(
    @Body() body: Record<string, string>,
    @Req() req: Request & { mtlsThumbprint?: string },
  ) {
    return this.oauth.issueToken({
      grantType: body.grant_type,
      clientId: body.client_id,
      clientSecret: body.client_secret,
      scope: body.scope,
      certificateThumbprint: req.mtlsThumbprint,
    });
  }
}