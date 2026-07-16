import { signWebhook, verifyWebhook } from './webhook-signature';

describe('webhook signature', () => {
  it('rejects body changes and stale timestamps', () => {
    const secret = Buffer.from('test-secret-only');
    const body = Buffer.from('{"eventId":"evt"}');
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signWebhook(secret, timestamp, body);

    expect(verifyWebhook(secret, timestamp, body, signature)).toBe(true);
    expect(verifyWebhook(secret, timestamp, Buffer.from('{}'), signature)).toBe(false);
    expect(verifyWebhook(secret, timestamp - 600, body, signature)).toBe(false);
  });
});