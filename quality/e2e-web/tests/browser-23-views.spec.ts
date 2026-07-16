import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  bffBase,
  bottomNavClick,
  ensureHome,
  homologSession,
  injectWebSession,
  sidebarNavigate,
} from './helpers/browser-session';

/** 23 view-* do HTML canônico → rótulo no menu lateral (Layout 1). */
const VIEW_SMOKE: ReadonlyArray<{ testId: string; menuLabel?: string; bottomNav?: string }> = [
  { testId: 'view-home', bottomNav: 'Início' },
  { testId: 'view-transactions', bottomNav: 'Extrato' },
  { testId: 'view-pix', bottomNav: 'Pix' },
  { testId: 'view-transfer', menuLabel: 'Transferência interna' },
  { testId: 'view-cards', menuLabel: 'Cartões' },
  { testId: 'view-investments', menuLabel: 'Investimentos' },
  { testId: 'view-crypto', menuLabel: 'Cripto (BRL)' },
  { testId: 'view-credit', menuLabel: 'Linhas de crédito' },
  { testId: 'view-protection', menuLabel: 'Proteção' },
  { testId: 'view-cloud', menuLabel: 'Cloud' },
  { testId: 'view-kids', menuLabel: 'Kids' },
  { testId: 'view-senior', menuLabel: 'Senior' },
  { testId: 'view-pets', menuLabel: 'Pets' },
  { testId: 'view-dreams', menuLabel: 'Realizar' },
  { testId: 'view-marketplace', menuLabel: 'Marketplace' },
  { testId: 'view-rewards', menuLabel: 'Rewards' },
  { testId: 'view-discounts', menuLabel: 'Descontos' },
  { testId: 'view-events', menuLabel: 'Eventos' },
  { testId: 'view-travel', menuLabel: 'Viagens' },
  { testId: 'view-sustainability', menuLabel: 'Sustentabilidade' },
  { testId: 'view-academy', menuLabel: 'Academy' },
  { testId: 'view-analytics', menuLabel: 'Analytics' },
  { testId: 'view-profile', bottomNav: 'Perfil' },
];

let bffRequest: APIRequestContext;

test.describe('Browser — 23 views smoke', () => {
  test.beforeAll(async ({ playwright }) => {
    bffRequest = await playwright.request.newContext({
      baseURL: bffBase(),
      extraHTTPHeaders: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
  });

  test.afterAll(async () => {
    await bffRequest.dispose();
  });

  test('todas as 23 views renderizam com sessão homolog', async ({ page }) => {
    test.setTimeout(180_000);
    const document = `7${String(Date.now()).slice(-10)}`;
    const session = await homologSession(bffRequest, document, 'E2E 23 Views');
    await injectWebSession(page, session);

    for (const view of VIEW_SMOKE) {
      await ensureHome(page);
      if (view.bottomNav) {
        await bottomNavClick(page, view.bottomNav);
      } else if (view.menuLabel) {
        await sidebarNavigate(page, view.menuLabel);
      }
      const viewport = page.locator('#screens-viewport');
      const locator =
        view.testId === 'view-home'
          ? viewport.locator('#view-home')
          : viewport.getByTestId(view.testId);
      await expect(locator.first(), `view ausente: ${view.testId}`).toBeVisible({ timeout: 30_000 });
    }
  });
});