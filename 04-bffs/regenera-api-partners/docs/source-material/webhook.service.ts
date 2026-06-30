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
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW    |
|---------------------------------------------------------------------------------------|
*/

import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { IdempotencyService } from '../../core/idempotency.service';
import { PixService } from '../../core/pix.service';

export interface WebhookPayload {
  eventId: string;
  type: string;
  timestamp: string;
  data: any;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger('WebhookIngress');

  constructor(
    private readonly config: ConfigService,
    private readonly idempotencyGuard: IdempotencyService,
    @Inject(forwardRef(() => PixService))
    private readonly pixService: PixService,
  ) {}

  /**
   * Processa Webhooks com Segurança Bank-Grade
   * 1. Valida Assinatura HMAC (Prevenção contra falsificação de chamadas BACEN/Adquirentes)
   * 2. Valida Idempotência (Prevenção de Replay Attacks)
   * 3. Roteia para os serviços Core
   */
  async processIncomingEvent(
    payload: WebhookPayload,
    signatureHeader?: string,
    rawBody?: string,
  ) {
    if (!payload.eventId) {
      throw new BadRequestException('Payload malformado. EventId ausente.');
    }

    // 1. Validação Criptográfica da Assinatura HMAC (Autenticidade)
    this.verifyHmacSignature(rawBody, signatureHeader);

    // 2. Validação de Idempotência
    const idempotencyKey = `WEBHOOK_${payload.eventId}`;
    const isProcessed = await this.idempotencyGuard.exists(idempotencyKey);

    if (isProcessed) {
      this.logger.warn(
        `[WEBHOOK REPLAY] Evento ${payload.eventId} já foi processado anteriormente. Ignorando.`,
      );
      return { status: 'ALREADY_PROCESSED', eventId: payload.eventId };
    }

    await this.idempotencyGuard.lock(idempotencyKey);

    try {
      this.logger.log(
        `[WEBHOOK] Roteando evento autêntico: ${payload.type} (ID: ${payload.eventId})`,
      );

      // 3. Roteamento de Negócio
      switch (payload.type) {
        case 'PIX_RECEIVED':
          // Delega o crédito na conta para a engine transacional do Pix
          await this.pixService.processIncomingPix(
            payload.data,
            payload.eventId,
          );
          break;

        case 'TRANSFER_CONFIRMED':
          this.logger.log(
            `[WEBHOOK] Transferência via OpenFinance confirmada E2E: ${payload.data.id}`,
          );
          break;

        default:
          this.logger.warn(
            `[WEBHOOK ALERT] Tipo de evento desconhecido ou não suportado: ${payload.type}`,
          );
      }

      await this.idempotencyGuard.save(idempotencyKey, { status: 'PROCESSED' });
      return { status: 'RECEIVED', eventId: payload.eventId };
    } catch (error) {
      await this.idempotencyGuard.unlock(idempotencyKey);
      this.logger.error(
        `[WEBHOOK CRÍTICO] Falha ao processar evento ${payload.eventId}: ${error.message}`,
      );
      throw error;
    }
  }

  private verifyHmacSignature(rawBody: string, signatureHeader: string) {
    if (!signatureHeader) {
      throw new UnauthorizedException(
        'Header de assinatura HMAC ausente (x-webhook-signature).',
      );
    }

    const secret =
      this.config.get<string>('WEBHOOK_SECRET') || 'default-secret-for-dev';

    const computedHash = createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    const computedHashBuffer = Buffer.from(computedHash);

    // Tratamento de segurança contra Timing Attacks: fallback seguro para tamanhos diferentes
    const providedHashBuffer = Buffer.from(signatureHeader);

    let isValid = false;
    if (computedHashBuffer.length === providedHashBuffer.length) {
      isValid = timingSafeEqual(computedHashBuffer, providedHashBuffer);
    }

    if (!isValid) {
      this.logger.error(
        `[WEBHOOK FRAUDE] Tentativa de spoofing. Assinatura inválida detectada.`,
      );
      throw new UnauthorizedException(
        'Assinatura digital inválida. Chamada rejeitada.',
      );
    }
  }
}
