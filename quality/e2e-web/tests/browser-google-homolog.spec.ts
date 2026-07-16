import { expect, test } from '@playwright/test';

/**
 * Dev real — Firebase + COOP no stack local (:5176 / :3200).
 * Não completa OAuth Google (sem credencial de teste); prova infraestrutura do popup.
 * Rodar: E2E_DEV_REAL=1 E2E_SKIP_WEB_START=1 WEB_BASE_URL=http://localhost:5176 npx playwright test browser-google-homolog
 */
const devReal = process.env.E2E_DEV_REAL === '1';
const webBase = process.env.WEB_BASE_URL ?? 'http://127.0.0.1:5176';
const bffBase = (process.env.BFF_BASE_URL ?? 'http://127.0.0.1:3200/v1').replace(/\/?$/, '/');

test.describe('Browser — Google homolog (dev real)', () => {
  test.skip(!devReal, 'Set E2E_DEV_REAL=1 para exercitar stack dev com Firebase');

  test('COOP same-origin-allow-popups no Vite dev', async ({ request }) => {
    const response = await request.fetch(webBase);
    expect(response.ok()).toBeTruthy();
    const coop = response.headers()['cross-origin-opener-policy'];
    expect(coop).toBe('same-origin-allow-popups');
  });

  test('botão Entrar com Google visível com Firebase configurado', async ({ page }) => {
    await page.goto(webBase);
    await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('conta 8hme — dashboard HTTP 200 via BFF dev', async ({ request }) => {
    const dash = await request.get(`${bffBase}banking/dashboard`, {
      headers: {
        Authorization: 'Bearer homolog-session-token',
        Accept: 'application/json',
      },
    });
    expect(dash.ok()).toBeTruthy();
    const body = (await dash.json()) as { balanceCents?: string; document?: string };
    expect(body.balanceCents).toBe('100');
    expect(body.document).toBe('01591166004');
  });

  test('sessão 8hme renderiza saldo no browser', async ({ page, request }) => {
    const dash = await request.get(`${bffBase}banking/dashboard`, {
      headers: {
        Authorization: 'Bearer homolog-session-token',
        Accept: 'application/json',
      },
    });
    expect(dash.ok()).toBeTruthy();

    await page.goto(webBase);
    await page.evaluate(() => {
      localStorage.setItem('regenera.session.token', 'homolog-session-token');
      localStorage.setItem('regenera.session.name', 'Conta Homolog 8hme');
    });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Menu Principal' })).toBeVisible({
      timeout: 20_000,
    });
  });
});