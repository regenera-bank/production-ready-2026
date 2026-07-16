import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const bffPort = Number(process.env.E2E_BFF_PORT ?? 3210);
const bffBaseUrl = (process.env.BFF_BASE_URL ?? `http://localhost:${bffPort}/v1`).replace(
  /\/?$/,
  '/',
);
/** Porta dedicada E2E — evita reutilizar dev:canal-web (:5176) com Firebase/BFF :3200. */
const webPort = Number(process.env.WEB_PORT ?? 5177);
const webBaseUrl = process.env.WEB_BASE_URL ?? `http://localhost:${webPort}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  reporter: process.env.CI ? [['line'], ['json', { outputFile: 'test-results.json' }]] : 'list',
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  webServer:
    process.env.E2E_SKIP_WEB_START === '1'
      ? undefined
      : {
          command: 'npm run dev',
          cwd: path.join(repoRoot, 'apps/web-banking'),
          port: webPort,
          timeout: 120_000,
          reuseExistingServer: process.env.E2E_REUSE_WEB === '1',
          env: {
            ...process.env,
            VITE_PORT: String(webPort),
            VITE_BFF_PROXY: `http://localhost:${bffPort}`,
            VITE_FIREBASE_API_KEY: '',
            VITE_FIREBASE_AUTH_DOMAIN: '',
            VITE_FIREBASE_PROJECT_ID: '',
          },
        },
  projects: [
    {
      name: 'api',
      testMatch: '**/*.spec.ts',
      testIgnore: '**/browser-*.spec.ts',
      use: {
        baseURL: bffBaseUrl,
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },
    {
      name: 'browser',
      testMatch: '**/browser-*.spec.ts',
      use: {
        baseURL: webBaseUrl,
      },
    },
  ],
});