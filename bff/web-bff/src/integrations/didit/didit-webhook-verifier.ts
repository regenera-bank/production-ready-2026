import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readDiditConfig } from './didit.config';
import { diditCanonicalJson } from './didit-canonical-json';
import type {
  DiditWebhookEnvelope,
  DiditWebhookHeaders,
  VerifiedDiditWebhook,
} from './didit.types';

const MAX_CLOCK_SKEW_SECONDS = 300;

@Injectable()
export class DiditWebhookVerifier {
  verify(input: {
    payload: DiditWebhookEnvelope;
    rawBody?: Buffer | string;
    headers: DiditWebhookHeaders;
  }): VerifiedDiditWebhook {
    const config = readDiditConfig(false);
    if (!config.webhookSecret) {
      throw new UnauthorizedException('DIDIT_WEBHOOK_SECRET_MISSING');
    }

    this.assertFreshTimestamp(input.headers.timestamp);

    const signatureV2 = input.headers.signatureV2?.trim();
    if (signatureV2 && this.verifyV2(input.payload, signatureV2, config.webhookSecret)) {
      return this.verified(input.payload, 'body', 'v2');
    }

    const signature = input.headers.signature?.trim();
    if (signature && input.rawBody && this.verifyRaw(input.rawBody, signature, config.webhookSecret)) {
      return this.verified(input.payload, 'raw-body', 'raw');
    }

    const signatureSimple = input.headers.signatureSimple?.trim();
    if (
      signatureSimple &&
      input.headers.timestamp &&
      this.verifySimple(input.payload, input.headers.timestamp, signatureSimple, config.webhookSecret)
    ) {
      return this.verified(input.payload, 'envelope-only', 'simple');
    }

    throw new UnauthorizedException('DIDIT_WEBHOOK_SIGNATURE_INVALID');
  }

  private verifyV2(payload: DiditWebhookEnvelope, signature: string, secret: string): boolean {
    return this.hmacEquals(secret, diditCanonicalJson(payload), signature);
  }

  private verifyRaw(rawBody: Buffer | string, signature: string, secret: string): boolean {
    return this.hmacEquals(secret, rawBody, signature);
  }

  private verifySimple(
    payload: DiditWebhookEnvelope,
    timestamp: string,
    signature: string,
    secret: string,
  ): boolean {
    const canonical = [
      timestamp,
      payload.session_id ?? '',
      payload.status ?? '',
      payload.webhook_type ?? '',
    ].join(':');

    return this.hmacEquals(secret, canonical, signature);
  }

  private hmacEquals(secret: string, value: Buffer | string, signatureHex: string): boolean {
    const expected = createHmac('sha256', secret).update(value).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(signatureHex, 'utf8');
    return (
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer)
    );
  }

  private assertFreshTimestamp(timestamp: string | undefined): void {
    if (!timestamp) {
      throw new UnauthorizedException('DIDIT_WEBHOOK_TIMESTAMP_MISSING');
    }

    const parsed = Number(timestamp);
    if (!Number.isInteger(parsed)) {
      throw new UnauthorizedException('DIDIT_WEBHOOK_TIMESTAMP_INVALID');
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parsed) > MAX_CLOCK_SKEW_SECONDS) {
      throw new UnauthorizedException('DIDIT_WEBHOOK_TIMESTAMP_STALE');
    }
  }

  private verified(
    payload: DiditWebhookEnvelope,
    trust: VerifiedDiditWebhook['trust'],
    signatureVersion: VerifiedDiditWebhook['signatureVersion'],
  ): VerifiedDiditWebhook {
    const sessionId = payload.session_id ?? payload.business_session_id;
    return {
      payload,
      trust,
      signatureVersion,
      eventId: payload.event_id ?? `${payload.webhook_type}:${sessionId ?? 'no-session'}:${payload.timestamp ?? Date.now()}`,
      sessionId,
    };
  }
}
