import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  authHeaders,
  getDashboard,
} from './helpers/bff-api';
import {
  bffBase,
  bottomNavClick,
  homologSession,
  injectWebSession,
  sidebarNavigate,
  webBase,
} from './helpers/browser-session';

let bffRequest: APIRequestContext;

test.describe('Browser — jornada completa homolog', () => {
  test.beforeAll(async ({ playwright }) => {
    bffRequest = await playwright.request.newContext({
      baseURL: bffBase(),
      extraHTTPHeaders: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
  });

  test.afterAll(async () => {
    await bffRequest.dispose();
  });

  test('cadastro API → conta ativa → home → Pix → extrato → comprovante BFF', async ({ page }) => {
    const document = `7${String(Date.now()).slice(-10)}`;
    const session = await homologSession(bffRequest, document, 'E2E Journey Full');

    const dashBefore = await getDashboard(bffRequest, session.accessToken);
    expect(Number(dashBefore.balanceCents)).toBeGreaterThanOrEqual(0);

    await injectWebSession(page, session);
    await expect(page.locator('#view-home')).toBeVisible({ timeout: 25_000 });

    await bottomNavClick(page, 'Pix');
    await expect(page.getByTestId('view-pix')).toBeVisible({ timeout: 15_000 });

    await bottomNavClick(page, 'Extrato');
    await expect(page.getByTestId('view-transactions')).toBeVisible({ timeout: 15_000 });

    const txRes = await bffRequest.get('banking/transactions', {
      headers: authHeaders(session.accessToken),
    });
    expect(txRes.ok()).toBeTruthy();
    const txBody = (await txRes.json()) as { items: Array<{ id: string }> };
    if (txBody.items.length > 0) {
      const receiptRes = await bffRequest.get(
        `banking/transactions/${encodeURIComponent(txBody.items[0].id)}/receipt`,
        { headers: authHeaders(session.accessToken) },
      );
      expect(receiptRes.ok()).toBeTruthy();
    }

    const consentRes = await bffRequest.get('consents/status', {
      headers: authHeaders(session.accessToken),
    });
    expect(consentRes.ok()).toBeTruthy();

    await page.goto(webBase());
    await expect(page.locator('#view-home')).toBeVisible();
  });
});