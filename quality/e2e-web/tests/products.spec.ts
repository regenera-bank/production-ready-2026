import { expect, test } from '@playwright/test';
import { authHeaders, completeKycAndOpenAccount, registerUser } from './helpers/bff-api';

test.describe('BFF products — cards & investments sandbox', () => {
  test('lista cartões sandbox via domain', async ({ request }) => {
    const document = '58244609005';
    const session = await registerUser(request, document, 'E2E Cards');
    await completeKycAndOpenAccount(request, session.accessToken);
    const res = await request.get('products/cards', {
      headers: authHeaders(session.accessToken),
    });
    expect(res.ok()).toBeTruthy();
    const cards = (await res.json()) as Array<{ id: string; status: string }>;
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  test('bloqueia e desbloqueia cartão', async ({ request }) => {
    const session = await registerUser(request, '01475636069', 'E2E Block');
    await completeKycAndOpenAccount(request, session.accessToken);
    const headers = authHeaders(session.accessToken);
    const list = await request.get('products/cards', { headers });
    const cards = (await list.json()) as Array<{ id: string }>;
    const cardId = cards[0].id;
    const block = await request.post(`products/cards/${cardId}/block`, {
      headers: { ...headers, 'idempotency-key': `block-${Date.now()}` },
    });
    expect(block.ok()).toBeTruthy();
    const blocked = (await block.json()) as { status: string };
    expect(blocked.status).toBe('locked');
    const unblock = await request.post(`products/cards/${cardId}/unblock`, {
      headers: { ...headers, 'idempotency-key': `unblock-${Date.now()}` },
    });
    expect(unblock.ok()).toBeTruthy();
  });

  test('investimentos: catálogo, ordem e posição', async ({ request }) => {
    const session = await registerUser(request, '95566027040', 'E2E Inv');
    await completeKycAndOpenAccount(request, session.accessToken);
    const headers = authHeaders(session.accessToken);
    const catalog = await request.get('products/investments/catalog', { headers });
    expect(catalog.ok()).toBeTruthy();
    const items = (await catalog.json()) as Array<{ id: string; minAmountCents: string }>;
    expect(items.length).toBeGreaterThan(0);
    const order = await request.post('products/investments/orders', {
      headers: { ...headers, 'idempotency-key': `inv-${Date.now()}` },
      data: { productId: items[0].id, amountCents: items[0].minAmountCents },
    });
    expect(order.ok()).toBeTruthy();
    const positions = await request.get('products/investments/positions', { headers });
    const pos = (await positions.json()) as unknown[];
    expect(pos.length).toBeGreaterThan(0);
  });

  test('ativação externa explícita para cartões', async ({ request }) => {
    const session = await registerUser(request, '12345678909', 'E2E Activation');
    const res = await request.get('products/cards/activation', {
      headers: authHeaders(session.accessToken),
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { externalProviderActive: boolean; message: string };
    expect(body.externalProviderActive).toBe(false);
    expect(body.message).toContain('EXTERNAL_ACTIVATION_REQUIRED');
  });
});