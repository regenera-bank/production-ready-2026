import { createHmac, timingSafeEqual } from 'node:crypto';

export function signWebhook(secret: Buffer, timestamp: number, body: Buffer): string {
  return createHmac('sha256', secret)
    .update(String(timestamp))
    .update('.')
    .update(body)
    .digest('base64url');
}

export function verifyWebhook(
  secret: Buffer,
  timestamp: number,
  body: Buffer,
  signature: string,
  now = Date.now(),
): boolean {
  if (Math.abs(now - timestamp * 1000) > 300_000) return false;
  const expected = Buffer.from(signWebhook(secret, timestamp, body));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}