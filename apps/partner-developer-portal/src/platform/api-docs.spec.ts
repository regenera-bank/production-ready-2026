import { describe, expect, it } from 'vitest';
import { API_ENDPOINTS, PARTNER_SCOPES, WEBHOOK_EVENTS } from './api-docs';

describe('api-docs', () => {
  it('exposes all partner scopes', () => {
    expect(PARTNER_SCOPES).toContain('sandbox:admin');
    expect(PARTNER_SCOPES.length).toBe(8);
  });

  it('documents webhook test endpoint', () => {
    const endpoint = API_ENDPOINTS.find((item) => item.path.includes('sandbox/webhooks/test'));
    expect(endpoint?.scope).toBe('sandbox:admin');
  });

  it('lists async webhook events', () => {
    expect(WEBHOOK_EVENTS).toContain('PIX_PAYMENT_SETTLED');
  });
});