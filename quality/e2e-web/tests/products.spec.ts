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
    const dashboardBefore = await request.get('banking/dashboard', { headers });
    const before = (await dashboardBefore.json()) as { balanceCents: string };
    expect(BigInt(before.balanceCents)).toBe(100n);
    const catalog = await request.get('products/investments/catalog', { headers });
    expect(catalog.ok()).toBeTruthy();
    const items = (await catalog.json()) as Array<{ id: string; minAmountCents: string }>;
    expect(items.length).toBeGreaterThan(0);
    const order = await request.post('products/investments/orders', {
      headers: { ...headers, 'idempotency-key': `inv-${Date.now()}` },
      data: { productId: items[0].id, amountCents: items[0].minAmountCents },
    });
    expect(order.ok()).toBeTruthy();
    const orderBody = (await order.json()) as {
      ledgerPaymentId?: string;
      balanceCents?: string;
      status: string;
    };
    expect(orderBody.ledgerPaymentId).toBeTruthy();
    expect(orderBody.status).toBe('filled');
    const dashboardAfter = await request.get('banking/dashboard', { headers });
    const after = (await dashboardAfter.json()) as {
      balanceCents: string;
      recentTransactions: Array<{ channel?: string }>;
    };
    expect(BigInt(after.balanceCents)).toBe(
      BigInt(before.balanceCents) - BigInt(items[0].minAmountCents),
    );
    expect(after.recentTransactions.some((tx) => tx.channel === 'investments')).toBeTruthy();
    const positions = await request.get('products/investments/positions', { headers });
    const pos = (await positions.json()) as unknown[];
    expect(pos.length).toBeGreaterThan(0);
  });

  test('lifecycle: emissão → autorização → captura → estorno', async ({ request }) => {
    const session = await registerUser(request, '86427539581', 'E2E Lifecycle');
    await completeKycAndOpenAccount(request, session.accessToken);
    const headers = authHeaders(session.accessToken);
    const issue = await request.post('products/cards/issue', {
      headers: { ...headers, 'idempotency-key': `issue-${Date.now()}` },
      data: { alias: 'E2E Crédito', limitCents: '200000' },
    });
    expect(issue.ok()).toBeTruthy();
    const issued = (await issue.json()) as { id: string };
    const auth = await request.post(`products/cards/${issued.id}/authorize`, {
      headers: { ...headers, 'idempotency-key': `auth-${Date.now()}` },
      data: { amountCents: '25', merchant: 'E2E Store' },
    });
    expect(auth.ok()).toBeTruthy();
    const authBody = (await auth.json()) as { authId: string };
    const dashBefore = await request.get('banking/dashboard', { headers });
    const balanceBefore = (await dashBefore.json()) as { balanceCents: string };
    expect(BigInt(balanceBefore.balanceCents)).toBe(100n);
    const capture = await request.post(
      `products/cards/${issued.id}/capture/${authBody.authId}`,
      { headers: { ...headers, 'idempotency-key': `cap-${Date.now()}` } },
    );
    expect(capture.ok()).toBeTruthy();
    const captureBody = (await capture.json()) as {
      ledgerPaymentId?: string;
      balanceCents?: string;
    };
    expect(captureBody.ledgerPaymentId).toBeTruthy();
    expect(BigInt(captureBody.balanceCents ?? '0')).toBe(75n);
    const dashAfterCapture = await request.get('banking/dashboard', { headers });
    const afterCapture = (await dashAfterCapture.json()) as {
      balanceCents: string;
      recentTransactions: Array<{ channel?: string }>;
    };
    expect(BigInt(afterCapture.balanceCents)).toBe(75n);
    expect(afterCapture.recentTransactions.some((tx) => tx.channel === 'card')).toBeTruthy();
    const reverse = await request.post(
      `products/cards/${issued.id}/reverse/${authBody.authId}`,
      { headers: { ...headers, 'idempotency-key': `rev-${Date.now()}` } },
    );
    expect(reverse.ok()).toBeTruthy();
    const invoice = await request.get(`products/cards/${issued.id}/invoice`, { headers });
    expect(invoice.ok()).toBeTruthy();
  });

  test('fatura e transações do cartão', async ({ request }) => {
    const session = await registerUser(request, '52998224725', 'E2E Invoice');
    await completeKycAndOpenAccount(request, session.accessToken);
    const headers = authHeaders(session.accessToken);
    const list = await request.get('products/cards', { headers });
    const cards = (await list.json()) as Array<{ id: string }>;
    const cardId = cards[0].id;
    const invoice = await request.get(`products/cards/${cardId}/invoice`, { headers });
    expect(invoice.ok()).toBeTruthy();
    const txs = await request.get(`products/cards/${cardId}/transactions`, { headers });
    expect(txs.ok()).toBeTruthy();
    const items = (await txs.json()) as unknown[];
    expect(items.length).toBeGreaterThan(0);
  });

  test('suitability de investimentos', async ({ request }) => {
    const session = await registerUser(request, '11144477735', 'E2E Suit');
    await completeKycAndOpenAccount(request, session.accessToken);
    const res = await request.get('products/investments/suitability', {
      headers: authHeaders(session.accessToken),
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { suitability: string; score: number };
    expect(['conservative', 'moderate', 'aggressive']).toContain(body.suitability);
    expect(body.score).toBeGreaterThanOrEqual(0);
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