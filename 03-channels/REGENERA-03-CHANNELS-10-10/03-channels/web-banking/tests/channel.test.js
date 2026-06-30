const test=require('node:test');
const assert=require('node:assert/strict');
const ch=require('../dist/channel.js');
const uuid='123e4567-e89b-42d3-a456-426614174000';
const intent=(state='READY',amountCents='100')=>({correlationId:uuid,idempotencyKey:uuid,amountCents,currency:'BRL',state});

test('UNKNOWN bloqueia repetição',()=>assert.throws(()=>ch.validateIntent(intent('UNKNOWN')),/RECONCILIATION/));
test('idempotência é obrigatória',()=>assert.throws(()=>ch.validateIntent({...intent(),idempotencyKey:'x'}),/IDEMPOTENCY/));
test('overflow monetário falha',()=>assert.throws(()=>ch.validateIntent(intent('READY','9223372036854775808')),/AMOUNT/));
test('saldo é projeção',()=>assert.equal(ch.presentBalance('100','2026-06-26T12:00:00Z').authoritative,false));
test('cookie usa prefixo host e atributos fechados',()=>{const c=ch.sessionCookie(900);assert.equal(c.name,'__Host-rb_session');assert.equal(c.httpOnly,true);assert.equal(c.secure,true);assert.equal(c.sameSite,'strict');assert.equal(c.path,'/')});
test('retry só após falha conclusiva',()=>{assert.equal(ch.canRetry('FAILED'),true);assert.equal(ch.canRetry('UNKNOWN'),false)});
test('telemetria remove dado fora da allowlist',()=>{const t=ch.sanitizeTelemetry({correlationId:uuid,route:'/pix',password:'x',amountCents:'100'});assert.deepEqual(Object.keys(t).sort(),['correlationId','route']);});
