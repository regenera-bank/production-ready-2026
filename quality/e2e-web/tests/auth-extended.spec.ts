import { expect, test } from '@playwright/test';
import { authHeaders, loginUser, registerUser } from './helpers/bff-api';

test.describe('BFF auth — extended', () => {
  test('sessão válida acessa rota protegida', async ({ request }) => {
    const document = '60746948030';
    const session = await registerUser(request, document, 'E2E Protected');
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
          postalCode: '01310-100',
        },
      },
    });
    expect([409, 200]).toContain(again.status());
  });

  test('rate limit de password reset não vaza existência', async ({ request }) => {
    const responses = [];
    for (let i = 0; i < 6; i++) {
      const res = await request.post('auth/password-reset/request', {
        data: { document: '99999999999' },
      });
      responses.push(res.status());
    }
    expect(responses.every((s) => s === 200 || s === 429)).toBeTruthy();
  });
});