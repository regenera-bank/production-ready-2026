import { defineConfig } from '@playwright/test';

const bffPort = Number(process.env.E2E_BFF_PORT ?? 3210);
const bffBaseUrl = (process.env.BFF_BASE_URL ?? `http://localhost:${bffPort}/v1`).replace(
  /\/?$/,
  '/',
);

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? [['line'], ['json', { outputFile: 'test-results.json' }]] : 'list',
  use: {
    baseURL: bffBaseUrl,
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});