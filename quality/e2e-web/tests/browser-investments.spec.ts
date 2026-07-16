import { expect, test, type APIRequestContext } from '@playwright/test';
import { completeKycAndOpenAccount, registerUser } from './helpers/bff-api';

const webBase =
  process.env.WEB_BASE_URL ??
  `http://localhost:${process.env.WEB_PORT ?? process.env.VITE_PORT ?? '5177'}`;
const bffBase = (process.env.BFF_BASE_URL ?? 'http://localhost:3210/v1').replace(/\/?$/, '/');

let bffRequest: APIRequestContext;

test.describe('Browser — view-investments', () => {
  test.beforeAll(async ({ playwright }) => {
    bffRequest = await playwright.request.newContext({
      baseURL: bffBase,
      extraHTTPHeaders: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
  });

  test.afterAll(async () => {
    await bffRequest.dispose();
  });

  test('renderiza catálogo de investimentos', async ({ page }) => {
    const document = '45317828791';
    const session = await registerUser(bffRequest, document, 'Browser Inv');
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

    await page.getByRole('button', { name: 'Menu Principal' }).click();
    await page.getByRole('button', { name: 'Investimentos' }).click();

    const catalogRes = await bffRequest.get('products/investments/catalog', {
      headers: { Authorization: `Bearer ${session.accessToken}`, Accept: 'application/json' },
    });
    expect(catalogRes.ok()).toBeTruthy();
    await expect(page.getByText('Investimentos', { exact: false }).first()).toBeVisible();
    const catalog = (await catalogRes.json()) as Array<{ name: string }>;
    expect(catalog.length).toBeGreaterThan(0);
  });
});