import { expect, test, type APIRequestContext } from '@playwright/test';
import { completeKycAndOpenAccount, registerUser } from './helpers/bff-api';

const webBase =
  process.env.WEB_BASE_URL ??
  `http://localhost:${process.env.WEB_PORT ?? process.env.VITE_PORT ?? '5177'}`;
const bffBase = (process.env.BFF_BASE_URL ?? 'http://localhost:3210/v1').replace(/\/?$/, '/');

let bffRequest: APIRequestContext;

test.describe('Browser — view-cards', () => {
  test.beforeAll(async ({ playwright }) => {
    bffRequest = await playwright.request.newContext({
      baseURL: bffBase,
      extraHTTPHeaders: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
  });

  test.afterAll(async () => {
    await bffRequest.dispose();
  });

  test('renderiza cartões após sessão homolog', async ({ page }) => {
    const document = '61293847501';
    const session = await registerUser(bffRequest, document, 'Browser Cards');
    await completeKycAndOpenAccount(bffRequest, session.accessToken);

    await page.goto(webBase);
    await page.evaluate(
      ({ token, name }) => {
        localStorage.setItem('regenera.session.token', token);
        localStorage.setItem('regenera.session.name', name);
      },
      { token: session.accessToken, name: session.displayName },
    );
    await page.reload();
    await expect(page.getByRole('button', { name: 'Menu Principal' })).toBeVisible({ timeout: 20_000 });

    await page.locator('#view-home').getByRole('button', { name: 'Cartões' }).click();
    await expect(page.getByText('Carteira Digital', { exact: false })).toBeVisible({ timeout: 15_000 });
    const cardsRes = await bffRequest.get('products/cards', {
      headers: { Authorization: `Bearer ${session.accessToken}`, Accept: 'application/json' },
    });
    expect(cardsRes.ok()).toBeTruthy();
    const cards = (await cardsRes.json()) as Array<{ alias: string }>;
    expect(cards.length).toBeGreaterThan(0);
  });
});