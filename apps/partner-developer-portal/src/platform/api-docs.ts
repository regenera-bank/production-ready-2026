export const PARTNER_SCOPES = [
  'accounts:read',
  'balances:read',
  'transactions:read',
  'pix:read',
  'pix:write',
  'webhooks:read',
  'webhooks:write',
  'sandbox:admin',
] as const;

export const API_ENDPOINTS = [
  { method: 'POST', path: '/v1/oauth/token', scope: '—', summary: 'Issue client credentials token' },
  { method: 'GET', path: '/v1/accounts', scope: 'accounts:read', summary: 'List partner-visible accounts' },
  { method: 'GET', path: '/v1/accounts/{id}/balance', scope: 'balances:read', summary: 'Read account balance' },
  { method: 'GET', path: '/v1/accounts/{id}/transactions', scope: 'transactions:read', summary: 'List transactions' },
  { method: 'POST', path: '/v1/pix/payments', scope: 'pix:write', summary: 'Create PIX payment (idempotent)' },
  { method: 'GET', path: '/v1/pix/payments/{id}', scope: 'pix:read', summary: 'Read PIX payment status' },
  { method: 'GET', path: '/v1/webhooks/subscriptions', scope: 'webhooks:read', summary: 'List webhook subscriptions' },
  { method: 'POST', path: '/v1/webhooks/subscriptions', scope: 'webhooks:write', summary: 'Register webhook endpoint' },
  { method: 'POST', path: '/v1/sandbox/webhooks/test', scope: 'sandbox:admin', summary: 'Emit test webhook delivery' },
] as const;

export const WEBHOOK_EVENTS = [
  'PIX_PAYMENT_STATUS_CHANGED',
  'PIX_PAYMENT_SETTLED',
  'PIX_PAYMENT_FAILED',
  'ACCOUNT_STATUS_CHANGED',
] as const;