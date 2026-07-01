import { expect, test } from '@playwright/test';
import {
  authHeaders,
  completeKycAndOpenAccount,
  getDashboard,
  registerUser,
} from './helpers/bff-api';

test.describe('BFF pix — resilience', () => {
  test('idempotency key repetida retorna mesmo efeito', async ({ request }) => {
    const debtor = await registerUser(request, '17845164035', 'E2E Idem Debtor');
    const creditor = await registerUser(request, '27153498023', 'E2E Idem Creditor');
    await completeKycAndOpenAccount(request, debtor.accessToken);
    await completeKycAndOpenAccount(request, creditor.accessToken);

    const key = `e2e-idem-${Date.now()}`;
    const headers = { ...authHeaders(debtor.accessToken), 'idempotency-key': key };
    const first = await request.post('banking/pix/transfers', {
      headers,
      data: { key: '27153498023', amountCents: '25' },
    });
    const second = await request.post('banking/pix/transfers', {
      headers,
      data: { key: '27153498023', amountCents: '25' },
    });
    expect(first.ok()).toBeTruthy();
    const a = (await first.json()) as { paymentId: string; balanceCents: string };
    const dashAfterFirst = await getDashboard(request, debtor.accessToken);
    if (second.ok()) {
      const b = (await second.json()) as { paymentId: string; balanceCents: string };
      expect(a.paymentId).toBe(b.paymentId);
      expect(a.balanceCents).toBe(b.balanceCents);
    } else {
      const dashAfterSecond = await getDashboard(request, debtor.accessToken);
      expect(dashAfterSecond.balanceCents).toBe(dashAfterFirst.balanceCents);
    }
  });

  test('saldo insuficiente rejeita Pix', async ({ request }) => {
    const debtor = await registerUser(request, '94531679000', 'E2E Insuf');
    await completeKycAndOpenAccount(request, debtor.accessToken);
    const res = await request.post('banking/pix/transfers', {
      headers: {
        ...authHeaders(debtor.accessToken),
        'idempotency-key': `e2e-insuf-${Date.now()}`,
      },
      data: { key: '11144477735', amountCents: '999999' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('extrato e saldo atualizados após Pix válido', async ({ request }) => {
    const debtor = await registerUser(request, '31641898040', 'E2E Stmt Debtor');
    const creditor = await registerUser(request, '74856912049', 'E2E Stmt Creditor');
    await completeKycAndOpenAccount(request, debtor.accessToken);
    await completeKycAndOpenAccount(request, creditor.accessToken);

    await request.post('banking/pix/transfers', {
      headers: {
        ...authHeaders(debtor.accessToken),
        'idempotency-key': `e2e-stmt-${Date.now()}`,
      },
      data: { key: '74856912049', amountCents: '30' },
    });

    const dash = await getDashboard(request, debtor.accessToken);
    expect(BigInt(dash.balanceCents)).toBe(70n);
    const tx = await request.get('banking/transactions', {
      headers: authHeaders(debtor.accessToken),
    });
    const body = (await tx.json()) as { items: unknown[] };
    expect(body.items.length).toBeGreaterThan(0);
  });
});