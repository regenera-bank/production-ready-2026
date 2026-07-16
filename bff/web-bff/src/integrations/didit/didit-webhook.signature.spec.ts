import { createHmac } from 'node:crypto';
import { canonicalJsonV2 } from './didit-canonical-json';
import { verifyDiditWebhookV2 } from './didit-webhook.signature';

describe('Didit webhook signature V2', () => {
  const secret = 'test-webhook-secret';
  const now = 1_700_000_000;

  it('aceita payload com HMAC válido', () => {
    const body = {
      event_id: 'evt-1',
      webhook_type: 'status.updated',
      session_id: 'sess-1',
      status: 'Approved',
      vendor_data: 'user-1',
    };
    const signature = createHmac('sha256', secret)
      .update(canonicalJsonV2(body), 'utf8')
      .digest('hex');

    const result = verifyDiditWebhookV2(
      body,
      { signatureV2: signature, timestamp: String(now) },
      secret,
      now,
    );
    expect(result.ok).toBe(true);
  });

  it('rejeita timestamp fora da janela', () => {
    const body = { event_id: 'evt-2' };
    const signature = createHmac('sha256', secret)
      .update(canonicalJsonV2(body), 'utf8')
      .digest('hex');

    const result = verifyDiditWebhookV2(
      body,
      { signatureV2: signature, timestamp: String(now - 400) },
      secret,
      now,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('300s');
    }
  });
});