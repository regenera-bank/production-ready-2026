import { expect, test } from '@playwright/test';
import { loginUser, registerUser } from './helpers/bff-api';

test.describe('BFF password reset', () => {
  test('usuário inexistente retorna resposta neutra', async ({ request }) => {
    const res = await request.post('auth/password-reset/request', {
      data: { document: '00000000000' },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { acknowledged: boolean; message: string };
    expect(body.acknowledged).toBe(true);
    expect(body.devToken).toBeUndefined();
  });

  test('fluxo completo: token válido altera senha', async ({ request }) => {
    const document = '86873574052';
    await registerUser(request, document, 'E2E Reset');

    const req = await request.post('auth/password-reset/request', {
      data: { document },
    });
    expect(req.ok()).toBeTruthy();
    const { devToken } = (await req.json()) as { devToken?: string };
    expect(devToken).toBeTruthy();

    const confirm = await request.post('auth/password-reset/confirm', {
      data: { token: devToken, newPassword: 'new-secret-e2e' },
    });
    expect(confirm.ok()).toBeTruthy();

    const oldLogin = await request.post('auth/session', {
      data: { document, password: 'secret-e2e' },
    });
    expect(oldLogin.status()).toBe(401);

    const newSession = await loginUser(request, document, 'new-secret-e2e');
    expect(newSession.accessToken).toMatch(/^homolog-/);
  });

  test('token inválido é rejeitado', async ({ request }) => {
    const res = await request.post('auth/password-reset/confirm', {
      data: { token: 'invalid-token', newPassword: 'x' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('token reutilizado é rejeitado', async ({ request }) => {
    const document = '71428765096';
    await registerUser(request, document, 'E2E Reuse');
    const req = await request.post('auth/password-reset/request', { data: { document } });
    const { devToken } = (await req.json()) as { devToken?: string };
    expect(devToken).toBeTruthy();
    const first = await request.post('auth/password-reset/confirm', {
      data: { token: devToken, newPassword: 'reuse-01' },
    });
    expect(first.ok()).toBeTruthy();
    const second = await request.post('auth/password-reset/confirm', {
      data: { token: devToken, newPassword: 'reuse-02' },
    });
    expect(second.status()).toBeGreaterThanOrEqual(400);
  });
});