import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { completeKycToApproved, registerUser } from './helpers/bff-api';

const webBase =
  process.env.WEB_BASE_URL ??
  `http://localhost:${process.env.WEB_PORT ?? process.env.VITE_PORT ?? '5177'}`;
const bffBase = (process.env.BFF_BASE_URL ?? 'http://localhost:3210/v1').replace(/\/?$/, '/');

/** WebAuthn virtual authenticator (CDP) — mock explícito declarado no relatório A04. */
const enableVirtualWebAuthn = async (page: Page): Promise<void> => {
  const client = await page.context().newCDPSession(page);
  await client.send('WebAuthn.enable');
  const { authenticatorId } = (await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerifyingPlatformAuthenticator: true,
    },
  })) as { authenticatorId: string };
  await client.send('WebAuthn.setAutomaticPresenceSimulation', {
    authenticatorId,
    enabled: true,
  });
  await client.send('WebAuthn.setUserVerified', {
    authenticatorId,
    isUserVerified: true,
  });
};

let bffRequest: APIRequestContext;

test.describe('Browser — onboarding digital (A04)', () => {
  test.beforeAll(async ({ playwright }) => {
    bffRequest = await playwright.request.newContext({
      baseURL: bffBase,
      extraHTTPHeaders: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
  });

  test.afterAll(async () => {
    await bffRequest.dispose();
  });

  test('card Cadastrar digital visível pós-KYC APPROVED e registra passkey', async ({ page }) => {
    const document = '48127653901';
    const session = await registerUser(bffRequest, document, 'Browser Digital');
    await completeKycToApproved(bffRequest, session.accessToken);

    await enableVirtualWebAuthn(page);
    await page.goto(webBase);
    await page.evaluate(
      ({ token, name }) => {
        localStorage.setItem('regenera.session.token', token);
        localStorage.setItem('regenera.session.name', name);
      },
      { token: session.accessToken, name: session.displayName },
    );
    await page.reload();

    await expect(page.getByText('KYC aprovado')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Chave digital (Touch ID)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cadastrar digital agora' })).toBeVisible();

    await page.getByRole('button', { name: 'Cadastrar digital agora' }).click();
    await expect(page.getByText('Digital cadastrada')).toBeVisible({ timeout: 20_000 });

    const statusRes = await bffRequest.get('auth/passkey/status/me', {
      headers: { Authorization: `Bearer ${session.accessToken}`, Accept: 'application/json' },
    });
    expect(statusRes.ok()).toBeTruthy();
    const body = (await statusRes.json()) as { enrolled?: boolean };
    expect(body.enrolled).toBe(true);
  });
});