import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { DiditOnboardingService } from './didit-onboarding.service';
import type { DiditWebhookEnvelope, DiditWebhookHeaders } from './didit.types';

type RawBodyRequest = Request & { rawBody?: Buffer | string };

@Controller()
export class DiditWebhookController {
  private readonly logger = new Logger(DiditWebhookController.name);

  constructor(private readonly diditOnboarding: DiditOnboardingService) {}

  /** Legado — Didit Console pode apontar para /v1/webhooks/didit */
  @Get('webhooks/didit')
  @HttpCode(200)
  probeLegacy(): { ok: true; accepts: 'POST'; signed: 'X-Signature-V2|X-Signature|X-Signature-Simple' } {
    return {
      ok: true,
      accepts: 'POST',
      signed: 'X-Signature-V2|X-Signature|X-Signature-Simple',
    };
  }

  @Post('webhooks/didit')
  @HttpCode(202)
  async handleLegacy(
    @Body() payload: DiditWebhookEnvelope,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() req: RawBodyRequest,
  ) {
    return this.dispatchWebhook(payload, headers, req);
  }

  /** Patch real-flow — path canônico para novos deploys */
  @Post('integrations/didit/webhooks')
  @HttpCode(202)
  async handleCanonical(
    @Body() payload: DiditWebhookEnvelope,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() req: RawBodyRequest,
  ) {
    return this.dispatchWebhook(payload, headers, req);
  }

  private async dispatchWebhook(
    payload: DiditWebhookEnvelope,
    headers: Record<string, string | string[] | undefined>,
    req: RawBodyRequest,
  ) {
    const normalizedHeaders: DiditWebhookHeaders = {
      timestamp: one(headers['x-timestamp']),
      signature: one(headers['x-signature']),
      signatureV2: one(headers['x-signature-v2']),
      signatureSimple: one(headers['x-signature-simple']),
      userAgent: one(headers['user-agent']),
      isTestWebhook: one(headers['x-didit-test-webhook']) === 'true',
    };

    try {
      return await this.diditOnboarding.handleWebhook({
        payload,
        rawBody: req.rawBody,
        headers: normalizedHeaders,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.logger.warn(
          `Didit webhook rejeitado: ${error.message}`,
        );
      }
      throw error;
    }
  }
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}