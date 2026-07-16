import { createHmac, timingSafeEqual } from 'node:crypto';
import { canonicalJsonV2 } from './didit-canonical-json';

const MAX_SKEW_SECONDS = 300;

export interface DiditWebhookHeaders {
  readonly signatureV2?: string;
  readonly timestamp?: string;
}

export const verifyDiditWebhookV2 = (
  body: unknown,
  headers: DiditWebhookHeaders,
  secret: string,
  nowUnix = Math.floor(Date.now() / 1000),
): { ok: true } | { ok: false; reason: string } => {
  if (!secret.trim()) {
    return { ok: false, reason: 'DIDIT_WEBHOOK_SECRET ausente' };
  }
  const signature = headers.signatureV2?.trim();
  if (!signature) {
    return { ok: false, reason: 'X-Signature-V2 ausente' };
  }
  const tsRaw = headers.timestamp?.trim();
  if (!tsRaw) {
    return { ok: false, reason: 'X-Timestamp ausente' };
  }
  const ts = Number(tsRaw);
  if (!Number.isFinite(ts)) {
    return { ok: false, reason: 'X-Timestamp inválido' };
  }
  if (Math.abs(nowUnix - ts) > MAX_SKEW_SECONDS) {
    return { ok: false, reason: 'X-Timestamp fora da janela de 300s' };
  }

  const canonical = canonicalJsonV2(body);
  const expected = createHmac('sha256', secret).update(canonical, 'utf8').digest('hex');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return { ok: false, reason: 'Assinatura HMAC inválida' };
  }
  return { ok: true };
};