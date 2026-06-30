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

import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSignatureValidator {
  validateSignature(
    rawBody: Buffer,
    signatureHeader: string,
    secretKey: string,
  ): boolean {
    if (!signatureHeader || !secretKey)
      throw new UnauthorizedException('Missing signature or secret');

    const hmac = crypto.createHmac('sha256', secretKey);
    const digest = hmac.update(rawBody).digest('hex');

    const signatureBuffer = Buffer.from(signatureHeader);
    const digestBuffer = Buffer.from(digest);

    if (
      signatureBuffer.length !== digestBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, digestBuffer)
    ) {
      throw new UnauthorizedException('Invalid Webhook Signature');
    }

    return true;
  }
}
