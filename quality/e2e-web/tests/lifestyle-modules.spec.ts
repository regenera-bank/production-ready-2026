import { expect, test } from '@playwright/test';
import { authHeaders, completeKycAndOpenAccount, registerUser } from './helpers/bff-api';

const MODULE_IDS = [
  'marketplace',
  'rewards',
  'benefits',
  'kids',
  'pets',
  'dreams',
  'events',
  'travel',
  'sustainability',
  'academy',
  'analytics',
  'protection',
  'cloud',
];

test.describe('BFF lifestyle — 13 módulos sandbox', () => {
  test('lista 13 módulos', async ({ request }) => {
    const res = await request.get('lifestyle/modules');
    expect(res.ok()).toBeTruthy();
    const modules = (await res.json()) as Array<{ id: string }>;
    expect(modules.length).toBe(13);
  });

  test('catálogo e ativação dos 13 módulos', async ({ request }) => {
    const session = await registerUser(request, '60746948030', 'E2E Lifestyle');
    await completeKycAndOpenAccount(request, session.accessToken);
    const headers = authHeaders(session.accessToken);

    for (const moduleId of MODULE_IDS) {
      const catalog = await request.get(`lifestyle/${moduleId}/catalog`, { headers });
      expect(catalog.ok()).toBeTruthy();
      const body = (await catalog.json()) as { moduleId: string; items: unknown[] };
      expect(body.moduleId).toBe(moduleId);
      expect(body.items.length).toBeGreaterThan(0);

      const activation = await request.get(`lifestyle/${moduleId}/activation`, { headers });
      expect(activation.ok()).toBeTruthy();
      const act = (await activation.json()) as { externalProviderActive: boolean };
      expect(act.externalProviderActive).toBe(false);
    }
  });
});