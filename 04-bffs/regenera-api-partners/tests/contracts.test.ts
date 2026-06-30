import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJson, payloadHash } from '../src/canonical-json.js';
import { signWebhook, verifyWebhook } from '../src/webhook-signature.js';

test('canonical JSON is stable across object key order', () => {
  assert.equal(canonicalJson({ b: 2, a: 1 }), canonicalJson({ a: 1, b: 2 }));
  assert.equal(payloadHash({ b: 2, a: 1 }), payloadHash({ a: 1, b: 2 }));
});

test('webhook signature rejects body changes and stale timestamps', () => {
  const secret = Buffer.from('test-secret-only');
  const body = Buffer.from('{"eventId":"evt"}');
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signWebhook(secret, timestamp, body);

  assert.equal(verifyWebhook(secret, timestamp, body, signature), true);
  assert.equal(verifyWebhook(secret, timestamp, Buffer.from('{}'), signature), false);
  assert.equal(verifyWebhook(secret, timestamp - 600, body, signature), false);
});
