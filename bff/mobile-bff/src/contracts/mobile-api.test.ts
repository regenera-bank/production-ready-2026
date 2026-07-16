import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DashboardResponseSchema,
  HomeResponseSchema,
  MoneyCentsSchema,
  MobileApiPaths,
  SessionResponseSchema,
} from './mobile-api.ts';

test('MoneyCentsSchema rejeita float', () => {
  assert.equal(MoneyCentsSchema.safeParse('10.50').success, false);
  assert.equal(MoneyCentsSchema.safeParse('1050').success, true);
});

test('SessionResponseSchema valida token mínimo', () => {
  const result = SessionResponseSchema.safeParse({
    accessToken: 'tok',
    userId: 'u1',
    displayName: 'Ana',
    expiresAt: '2026-06-30T12:00:00.000Z',
  });
  assert.equal(result.success, true);
});

test('DashboardResponseSchema exige centavos em string', () => {
  const result = DashboardResponseSchema.safeParse({
    accountId: 'acc',
    maskedAccount: '****1234',
    agency: '0001',
    document: '***',
    balanceCents: '150000',
    availableCents: '140000',
    currency: 'BRL',
    correlationId: 'corr-1',
    recentTransactions: [],
  });
  assert.equal(result.success, true);
});

test('MobileApiPaths expõe rotas versionadas', () => {
  assert.equal(MobileApiPaths.health, '/v1/health');
  assert.equal(MobileApiPaths.home, '/v1/home');
  assert.equal(MobileApiPaths.pixTransfers, '/v1/banking/pix/transfers');
});

test('HomeResponseSchema valida bootstrap sem dashboard', () => {
  const result = HomeResponseSchema.safeParse({
    service: 'mobile-bff',
    ready: true,
    correlationId: 'corr-1',
    channelContractVersion: '2026-07-02-wave1',
    supportedChannels: ['ANDROID', 'IOS'],
    modules: [
      { moduleId: 'M01', slug: 'home', classification: 'PRODUCTION', enabled: true },
    ],
  });
  assert.equal(result.success, true);
});