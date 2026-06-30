/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookSignatureValidator } from './signature.validator';

@Controller('webhooks')
export class WebhookController {
  constructor(
    private webhookService: WebhookService,
    private validator: WebhookSignatureValidator,
  ) {}

  @Post('celcoin')
  async handleCelcoinWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-webhook-signature') signature: string,
    @Body() payload: any,
  ) {
    const secret = process.env.CELCOIN_WEBHOOK_SECRET;
    this.validator.validateSignature(req.rawBody, signature, secret);

    return await this.webhookService.processIncomingEvent(payload);
  }
}
