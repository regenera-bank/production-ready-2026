import { expect, test, type APIRequestContext } from '@playwright/test';
import { registerUser } from './helpers/bff-api';

const webBase =
  process.env.WEB_BASE_URL ??
  `http://localhost:${process.env.WEB_PORT ?? process.env.VITE_PORT ?? '5177'}`;
const bffBase = (process.env.BFF_BASE_URL ?? 'http://localhost:3210/v1').replace(/\/?$/, '/');

let bffRequest: APIRequestContext;

test.describe('Browser — esqueci senha (A02)', () => {
  test.beforeAll(async ({ playwright }) => {
    bffRequest = await playwright.request.newContext({
      baseURL: bffBase,
      extraHTTPHeaders: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
  });

  test.afterAll(async () => {
    await bffRequest.dispose();
  });

  test('fluxo CPF homolog: solicitar token → confirmar → login com nova senha', async ({ page }) => {
    const document = '38172645902';
    const newPassword = 'nova-senha-e2e-a02';
    await registerUser(bffRequest, document, 'Browser Reset Senha');

    await page.goto(`${webBase}${webBase.includes('?') ? '&' : '?'}skipIntro=1`);
    await expect(page.locator('#screen-login')).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder('CPF').fill(document);
    await page.getByRole('button', { name: 'Esqueci minha senha' }).click();
    await expect(page.getByText('Recuperar senha')).toBeVisible();

    await page.getByRole('button', { name: 'Solicitar token' }).click();
    await expect(page.getByPlaceholder('Token de recuperação')).toBeVisible({ timeout: 10_000 });

    const tokenValue = await page.getByPlaceholder('Token de recuperação').inputValue();
    expect(tokenValue.length).toBeGreaterThan(8);

    await page.getByPlaceholder('Nova senha').fill(newPassword);
    await page.getByRole('button', { name: 'Confirmar nova senha' }).click();
    await expect(page.getByText('Recuperar senha')).toBeHidden({ timeout: 10_000 });

    await page.getByPlaceholder('Senha').fill(newPassword);
    await page.getByRole('button', { name: 'Entrar com senha' }).click();

    await expect(page.locator('#screen-login')).toBeHidden({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /Abertura de\s+Conta/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});