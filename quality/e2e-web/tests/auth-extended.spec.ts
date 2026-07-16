import { expect, test } from '@playwright/test';
import { authHeaders, completeKycAndOpenAccount, registerUser } from './helpers/bff-api';

test.describe('BFF auth — extended', () => {
  test('sessão válida acessa rota protegida', async ({ request }) => {
    const document = '33211229091';
    const session = await registerUser(request, document, 'E2E Protected');
    await completeKycAndOpenAccount(request, session.accessToken);
    const dash = await request.get('banking/dashboard', {
      headers: authHeaders(session.accessToken),
    });
    expect(dash.ok()).toBeTruthy();
  });

  test('rota protegida sem token retorna 401', async ({ request }) => {
    const response = await request.get('banking/dashboard');
    expect(response.status()).toBe(401);
  });

  test('token inválido retorna 401', async ({ request }) => {
    const response = await request.get('banking/dashboard', {
      headers: authHeaders('homolog-invalid-token'),
    });
    expect(response.status()).toBe(401);
  });

  test('cadastro duplicado retorna 409 ou reautentica', async ({ request }) => {
    const document = '15350946056';
    await registerUser(request, document, 'E2E Dup');
    const again = await request.post('auth/register', {
      data: {
        document,
        password: 'secret-e2e',
        displayName: 'Dup',
        email: `${document}@e2e.regenera.test`,
        phone: '11999990000',
        birthDate: '1990-05-15',
        address: {
          street: 'Rua A',
          number: '1',
          neighborhood: 'Centro',
          city: 'SP',
          state: 'SP',
          postalCode: '0130',
        },
      },
    });
    expect([409, 200]).toContain(again.status());
  });

  test('rate limit de password reset não vaza existência', async ({ request }) => {
    const document = '87702044000';
    await registerUser(request, document, 'E2E Rate');
    for (let i = 0; i < 5; i++) {
      const res = await request.post('auth/password-reset/request', {
        data: { document },
      });
      expect(res.ok()).toBeTruthy();
      const body = (await res.json()) as { acknowledged: boolean };
      expect(body.acknowledged).toBe(true);
    }
    const blocked = await request.post('auth/password-reset/request', {
      data: { document },
    });
    expect(blocked.status()).toBe(429);
  });
});