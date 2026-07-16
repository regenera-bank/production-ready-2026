import { expect, test } from '@playwright/test';
import {
  authHeaders,
  completeKycAndOpenAccount,
  getDashboard,
  registerUser,
} from './helpers/bff-api';

test.describe('BFF banking — transfer flow', () => {
  test('transfere entre contas homolog via POST /banking/transfers', async ({ request }) => {
    const debtorDocument = '60746948030';
    const creditorDocument = '45317828791';

    const debtor = await registerUser(request, debtorDocument, 'E2E Transfer Debtor');
    const creditor = await registerUser(request, creditorDocument, 'E2E Transfer Creditor');

    await completeKycAndOpenAccount(request, debtor.accessToken);
    await completeKycAndOpenAccount(request, creditor.accessToken);

    const debtorBefore = await getDashboard(request, debtor.accessToken);
    expect(BigInt(debtorBefore.balanceCents)).toBe(100n);

    const transfer = await request.post('banking/transfers', {
      headers: {
        ...authHeaders(debtor.accessToken),
        'idempotency-key': `e2e-transfer-${Date.now()}`,
      },
      data: {
        toDocument: creditorDocument,
        amountCents: '40',
      },
    });
    expect(transfer.ok()).toBeTruthy();
    const transferBody = (await transfer.json()) as {
      amountCents: string;
      balanceCents: string;
      creditorName: string;
      paymentId: string;
    };
    expect(transferBody.amountCents).toBe('40');
    expect(transferBody.creditorName).toBe('E2E Transfer Creditor');
    expect(transferBody.paymentId).toBeTruthy();
    expect(BigInt(transferBody.balanceCents)).toBe(60n);

    const creditorAfter = await getDashboard(request, creditor.accessToken);
    expect(BigInt(creditorAfter.balanceCents)).toBe(140n);
  });
});