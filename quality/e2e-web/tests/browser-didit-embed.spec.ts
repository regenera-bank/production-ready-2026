import { expect, test, type APIRequestContext } from '@playwright/test';
import { advanceToDiditCadastral, registerUser } from './helpers/bff-api';
import { injectWebSession, webBase } from './helpers/browser-session';

const bffBase = (process.env.BFF_BASE_URL ?? 'http://localhost:3200/v1').replace(/\/?$/, '/');

let bffRequest: APIRequestContext;
let diditEnabled = false;

test.describe('Browser — Didit embed', () => {
  test.beforeAll(async ({ playwright }) => {
    bffRequest = await playwright.request.newContext({
      baseURL: bffBase,
      extraHTTPHeaders: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
    const health = await bffRequest.get('health/integrations');
    if (health.ok()) {
      const body = (await health.json()) as { integrations?: { didit?: boolean } };
      diditEnabled = body.integrations?.didit === true;
    }
  });

  test.afterAll(async () => {
    await bffRequest.dispose();
  });

  test('iframe Didit embutido com src verify.didit.me', async ({ page }) => {
    test.skip(!diditEnabled, 'BFF sem KYC_PROVIDER=didit — suba dev:canal-web com Didit configurado');

    const document = `9${String(Date.now()).slice(-10)}`;
    const session = await registerUser(bffRequest, document, 'E2E Didit Embed');
    await advanceToDiditCadastral(bffRequest, session.accessToken);

    await injectWebSession(page, session);

    const diditStep = page.getByTestId('didit-kyc-step');
    await expect(diditStep).toBeVisible({ timeout: 25_000 });

    await page.getByTestId('didit-pick-cnh').click();
    await page.getByTestId('didit-cnh-digital').click();
    await page.getByTestId('didit-start-opening').click();

    const iframe = page.locator('#didit-kyc-iframe-host iframe');
    await expect(iframe).toBeVisible({ timeout: 45_000 });

    const src = await iframe.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toContain('verify.didit.me');

    await expect(page.getByTestId('didit-boot-overlay')).toBeHidden({ timeout: 30_000 });

    const allow = await iframe.getAttribute('allow');
    expect(allow ?? '').toMatch(/camera/i);
    expect(allow ?? '').toMatch(/microphone/i);
  });
});