import { expect, type APIRequestContext, type Page } from '@playwright/test';
import {
  authHeaders,
  completeKycAndOpenAccount,
  completeKycToApproved,
  registerUser,
  type SessionDto,
} from './bff-api';

export const webBase = () =>
  process.env.WEB_BASE_URL ??
  `http://localhost:${process.env.WEB_PORT ?? process.env.VITE_PORT ?? '5177'}`;

export const bffBase = () =>
  (process.env.BFF_BASE_URL ?? 'http://localhost:3210/v1').replace(/\/?$/, '/');

export async function homologSession(
  request: APIRequestContext,
  document: string,
  displayName: string,
): Promise<SessionDto> {
  const session = await registerUser(request, document, displayName);
  try {
    await completeKycAndOpenAccount(request, session.accessToken);
  } catch {
    await completeKycToApproved(request, session.accessToken);
    const headers = authHeaders(session.accessToken);
    const status = await request.get('onboarding/status', { headers });
    const body = (await status.json()) as { accountStatus?: string };
    if (body.accountStatus !== 'ACTIVE') {
      const open = await request.post('onboarding/account/open', { headers });
      if (!open.ok()) {
        throw new Error(`account/open failed: ${open.status()} ${await open.text()}`);
      }
    }
  }
  return session;
}

export async function injectWebSession(page: Page, session: SessionDto): Promise<void> {
  await page.goto(webBase());
  await page.evaluate(
    ({ token, name }) => {
      localStorage.setItem('regenera.session.token', token);
      localStorage.setItem('regenera.session.name', name);
    },
    { token: session.accessToken, name: session.displayName },
  );
  await page.reload();
}

export async function ensureHome(page: Page): Promise<void> {
  const home = page.locator('#view-home');
  if (await home.isVisible().catch(() => false)) {
    return;
  }
  const back = page.getByRole('button', { name: 'Voltar' });
  for (let i = 0; i < 6; i += 1) {
    if (await home.isVisible().catch(() => false)) {
      return;
    }
    if (await back.isVisible().catch(() => false)) {
      await back.click();
      await page.waitForTimeout(300);
    } else {
      break;
    }
  }
  await bottomNavClick(page, 'Início');
  await expect(home).toBeVisible({ timeout: 20_000 });
}

export async function openSidebar(page: Page): Promise<void> {
  await ensureHome(page);
  await page.getByRole('button', { name: 'Menu Principal' }).click({ timeout: 20_000 });
}

export async function sidebarNavigate(page: Page, label: string): Promise<void> {
  await openSidebar(page);
  const menu = page.getByRole('dialog', { name: 'Menu principal' });
  await menu.getByRole('button', { name: label, exact: true }).click();
  await expect(menu).toBeHidden({ timeout: 10_000 });
}

export async function bottomNavClick(page: Page, ariaLabel: string): Promise<void> {
  await page
    .locator('footer.bottom-nav-surface')
    .getByRole('button', { name: ariaLabel, exact: true })
    .click();
}