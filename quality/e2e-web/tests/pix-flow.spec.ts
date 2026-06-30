import { expect, test } from '@playwright/test';
import {
  authHeaders,
  completeKycAndOpenAccount,
  getDashboard,
  registerUser,
} from './helpers/bff-api';

test.describe('BFF banking — pix flow', () => {
  test('envia Pix interno com crédito homolog de R$1', async ({ request }) => {
    const debtorDocument = '11144477735';
    const creditorDocument = '39053344705';

    const debtor = await registerUser(request, debtorDocument, 'E2E Pix Debtor');
    const creditor = await registerUser(request, creditorDocument, 'E2E Pix Creditor');

    await completeKycAndOpenAccount(request, debtor.accessToken);
    await completeKycAndOpenAccount(request, creditor.accessToken);

    const debtorBefore = await getDashboard(request, debtor.accessToken);
    expect(BigInt(debtorBefore.balanceCents)).toBe(100n);

    const pix = await request.post('banking/pix/transfers', {
      headers: {
        ...authHeaders(debtor.accessToken),
        'idempotency-key': `e2e-pix-${Date.now()}`,
      },
      data: {
        key: creditorDocument,
        amountCents: '50',
      },
    });
    expect(pix.ok()).toBeTruthy();
    const pixBody = (await pix.json()) as {
      amountCents: string;
      balanceCents: string;
      endToEndId: string;
    };
    expect(pixBody.amountCents).toBe('50');
    expect(pixBody.endToEndId).toMatch(/^E/);
    expect(BigInt(pixBody.balanceCents)).toBe(50n);

    const creditorAfter = await getDashboard(request, creditor.accessToken);
    expect(BigInt(creditorAfter.balanceCents)).toBe(150n);
  });
});