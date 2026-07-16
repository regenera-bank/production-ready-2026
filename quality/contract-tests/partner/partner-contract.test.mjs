import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const openapiPath = join(root, 'contracts/openapi/partner-api-v1.openapi.yaml');
const asyncapiPath = join(root, 'contracts/asyncapi/partner-webhooks-v1.asyncapi.yaml');
const errorCatalogPath = join(root, 'governance/error-catalog/CORE-ERRORS.json');

function readText(path) {
  return readFileSync(path, 'utf8');
}

test('partner OpenAPI contract exists with OAuth, scopes, and webhook paths', () => {
  const yaml = readText(openapiPath);
  assert.match(yaml, /title: Regenera Partner API/);
  assert.match(yaml, /\/oauth\/token:/);
  assert.match(yaml, /\/webhooks\/subscriptions:/);
  assert.match(yaml, /\/sandbox\/webhooks\/test:/);
  assert.match(yaml, /x-partner-scopes:/);
  assert.match(yaml, /x-error-catalog:/);
  assert.match(yaml, /x-webhook-contract:/);
  assert.match(yaml, /oauth2ClientCredentials:/);
  assert.match(yaml, /pix:write/);
});

test('partner OpenAPI references stable CORE-ERRORS codes in responses', () => {
  const yaml = readText(openapiPath);
  const catalog = JSON.parse(readFileSync(errorCatalogPath, 'utf8'));
  const codes = catalog.errors.map((item) => item.code);

  for (const code of ['RBK-AUTH-001', 'RBK-AUTH-003', 'RBK-IDP-001', 'RBK-SYS-003', 'RBK-PIX-003']) {
    assert.match(yaml, new RegExp(code));
    assert.ok(codes.includes(code), `missing ${code} in CORE-ERRORS`);
  }
});

test('partner AsyncAPI webhook contract defines signed delivery events', () => {
  const yaml = readText(asyncapiPath);
  assert.match(yaml, /title: Regenera Partner Webhooks/);
  assert.match(yaml, /PIX_PAYMENT_STATUS_CHANGED/);
  assert.match(yaml, /PIX_PAYMENT_SETTLED/);
  assert.match(yaml, /PIX_PAYMENT_FAILED/);
  assert.match(yaml, /ACCOUNT_STATUS_CHANGED/);
  assert.match(yaml, /X-Regenera-Signature/);
});

test('OpenAPI webhook events align with AsyncAPI payloads', () => {
  const openapi = readText(openapiPath);
  const asyncapi = readText(asyncapiPath);
  const events = [
    'PIX_PAYMENT_STATUS_CHANGED',
    'PIX_PAYMENT_SETTLED',
    'PIX_PAYMENT_FAILED',
    'ACCOUNT_STATUS_CHANGED',
  ];

  for (const event of events) {
    assert.match(openapi, new RegExp(event));
    assert.match(asyncapi, new RegExp(event));
  }
});