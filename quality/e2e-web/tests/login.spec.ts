import { expect, test } from '@playwright/test';
import { loginUser, registerUser } from './helpers/bff-api';

test.describe('BFF auth — login', () => {
  test('cadastra e autentica via POST /auth/session', async ({ request }) => {
    const document = '52998224725';

    const registered = await registerUser(request, document, 'E2E Login User');
    expect(registered.accessToken).toMatch(/^homolog-/);
    expect(registered.userId).toBe(document);
    expect(registered.kycStatus).toBe('PENDING');

    const session = await loginUser(request, document);
    expect(session.accessToken).toMatch(/^homolog-/);
    expect(session.userId).toBe(document);
    expect(session.displayName).toBe('E2E Login User');
  });

  test('rejeita credenciais inválidas', async ({ request }) => {
    const response = await request.post('auth/session', {
      data: { document: '99999999999', password: 'wrong' },
    });
    expect(response.status()).toBe(401);
  });
});