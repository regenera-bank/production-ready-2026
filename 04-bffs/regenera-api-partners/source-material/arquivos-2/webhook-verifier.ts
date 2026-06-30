// webhook-verifier.ts
//
// assinatura "t=<unix>,v1=<hmac-hex>", hmac sobre "<unix>.<corpo bruto>".
// o timestamp dentro do material assinado impede replay de corpo velho
// com cabeçalho novo. comparação timing-safe porque atacante com
// cronômetro existe e é paciente.
//
// correção importante nesta versão: antes, uma entrega com assinatura
// INVÁLIDA gravava o event_id como REJECTED — e quando a entrega
// legítima chegava, caía no ON CONFLICT e virava duplicate pra sempre.
// ou seja: qualquer um que soubesse um event_id queimava o evento real.
// agora entrega válida retoma evento rejeitado. duplicado de verdade
// continua duplicado; queimado por terceiro, não existe mais.

import { createHmac, createHash, timingSafeEqual } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface WebhookVerifierConfig {
  signingSecret: string;
  toleranceSeconds: number;
}

export interface VerifiedWebhook {
  inboundEventId: string;
  duplicate: boolean;
}

@Injectable()
export class WebhookVerifier {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: WebhookVerifierConfig,
  ) {}

  computeSignature(timestampSeconds: number, rawBody: string): string {
    return createHmac('sha256', this.config.signingSecret)
      .update(`${timestampSeconds}.${rawBody}`, 'utf8')
      .digest('hex');
  }

  parseHeader(header: string): { timestamp: number; signature: string } {
    const parts = new Map<string, string>();
    for (const piece of header.split(',')) {
      const [key, value] = piece.split('=', 2);
      if (key && value) parts.set(key.trim(), value.trim());
    }
    const timestamp = Number(parts.get('t'));
    const signature = parts.get('v1') ?? '';
    if (!Number.isInteger(timestamp) || !/^[0-9a-f]{64}$/.test(signature)) {
      // erro genérico de propósito. detalhar o que falhou no parse é
      // dar tutorial de forjamento pra quem está tentando.
      throw new UnauthorizedException({ code: 'WEBHOOK_SIGNATURE_MALFORMED' });
    }
    return { timestamp, signature };
  }

  assertSignature(header: string, rawBody: string, now: Date = new Date()): number {
    const { timestamp, signature } = this.parseHeader(header);
    const skewSeconds = Math.abs(now.getTime() / 1000 - timestamp);
    if (skewSeconds > this.config.toleranceSeconds) {
      throw new UnauthorizedException({ code: 'WEBHOOK_TIMESTAMP_OUT_OF_TOLERANCE' });
    }
    const expected = Buffer.from(this.computeSignature(timestamp, rawBody), 'hex');
    const received = Buffer.from(signature, 'hex');
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new UnauthorizedException({ code: 'WEBHOOK_SIGNATURE_INVALID' });
    }
    return timestamp;
  }

  // a unicidade (source, external_event_id) deixa o provedor reentregar
  // à vontade: a segunda entrega válida volta duplicate=true e o handler
  // responde 200 sem reprocessar. reprocessar webhook de liquidação
  // duas vezes é creditar duas vezes — a tabela é a memória, não o código.
  async claim(source: string, externalEventId: string, header: string, rawBody: string): Promise<VerifiedWebhook> {
    try {
      this.assertSignature(header, rawBody);
    } catch (error: unknown) {
      // registra a tentativa inválida sem ocupar o lugar do evento real:
      // DO NOTHING aqui significa que se o evento legítimo já existe,
      // a tentativa forjada nem encosta nele.
      await this.dataSource.query(
        `INSERT INTO inbound_events
           (source, external_event_id, signature_valid, payload_hash, status, failure_detail)
         VALUES ($1, $2, false, $3, 'REJECTED', $4)
         ON CONFLICT (source, external_event_id) DO NOTHING`,
        [source, externalEventId, this.hashPayload(rawBody),
         error instanceof Error ? error.message.slice(0, 500) : 'assinatura inválida'],
      );
      throw error;
    }

    // entrega VÁLIDA: insere, ou — se o id estava queimado por uma
    // tentativa REJECTED anterior — retoma o registro pra PROCESSING.
    // o WHERE garante que COMPLETED/PROCESSING legítimos não são tocados.
    const claimed: Array<{ id: string; resumed: boolean }> = await this.dataSource.query(
      `INSERT INTO inbound_events
         (source, external_event_id, signature_valid, payload_hash, status)
       VALUES ($1, $2, true, $3, 'PROCESSING')
       ON CONFLICT (source, external_event_id) DO UPDATE
         SET signature_valid = true,
             payload_hash = EXCLUDED.payload_hash,
             status = 'PROCESSING',
             failure_detail = NULL
       WHERE inbound_events.status = 'REJECTED'
         AND inbound_events.signature_valid = false
       RETURNING id, (xmax <> 0) AS resumed`,
      [source, externalEventId, this.hashPayload(rawBody)],
    );
    if (claimed.length === 1) {
      return { inboundEventId: claimed[0].id, duplicate: false };
    }

    // não inseriu nem retomou: o evento existe e é legítimo. duplicado.
    const [existing]: Array<{ id: string }> = await this.dataSource.query(
      `SELECT id FROM inbound_events WHERE source = $1 AND external_event_id = $2`,
      [source, externalEventId],
    );
    return { inboundEventId: existing.id, duplicate: true };
  }

  async complete(inboundEventId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE inbound_events
          SET status = 'COMPLETED', processed_at = now()
        WHERE id = $1 AND status = 'PROCESSING'`,
      [inboundEventId],
    );
  }

  async reject(inboundEventId: string, detail: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE inbound_events
          SET status = 'REJECTED', processed_at = now(), failure_detail = $2
        WHERE id = $1 AND status = 'PROCESSING'`,
      [inboundEventId, detail.slice(0, 500)],
    );
  }

  private hashPayload(rawBody: string): string {
    return createHash('sha256').update(rawBody, 'utf8').digest('hex');
  }
}
