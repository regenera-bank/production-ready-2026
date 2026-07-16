import { createHmac } from 'node:crypto';
import { DiditWebhookVerifier } from './didit-webhook-verifier';
import { diditCanonicalJson } from './didit-canonical-json';

describe('DiditWebhookVerifier', () => {
  beforeEach(() => {
    process.env.DIDIT_WEBHOOK_SECRET = 'secret';
    process.env.DIDIT_KYC_WORKFLOW_ID = '11111111-2222-3333-4444-555555555555';
  });

  it('accepts X-Signature-V2 over canonical JSON', () => {
    const payload = {
      webhook_type: 'status.updated',
      session_id: '11111111-2222-3333-4444-555555555555',
      status: 'Approved',
      vendor_data: 'regenera:user:u1',
      timestamp: Math.floor(Date.now() / 1000),
      decision: { name: 'José', score: 1 },
    };
    const signatureV2 = createHmac('sha256', 'secret').update(diditCanonicalJson(payload)).digest('hex');
    const result = new DiditWebhookVerifier().verify({
      payload,
      headers: { timestamp: String(payload.timestamp), signatureV2 },
    });
    expect(result.trust).toBe('body');
    expect(result.signatureVersion).toBe('v2');
  });
});
