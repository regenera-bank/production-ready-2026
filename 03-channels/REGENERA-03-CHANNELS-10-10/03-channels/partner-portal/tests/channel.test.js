const test=require('node:test');
const assert=require('node:assert/strict');
const ch=require('../dist/channel.js');
const fp='A'.repeat(64); const future='2099-01-01T00:00:00Z'; const secret='k'.repeat(32);
function envelope(overrides={}){const timestamp=Date.now();const nonce='abcdefghijklmnop';const body='{"event":"paid"}';return {id:'evt-1',timestamp,nonce,body,signature:ch.signWebhook(body,timestamp,nonce,secret),...overrides};}

test('mTLS é obrigatório',()=>assert.throws(()=>ch.authorizePartner({certificateFingerprint:'x',scopes:['payments:read'],expiresAt:future},'payments:read'),/MTLS/));
test('escopo mínimo é aplicado',()=>assert.throws(()=>ch.authorizePartner({certificateFingerprint:fp,scopes:[],expiresAt:future},'payments:read'),/SCOPE/));
test('HMAC válido passa',()=>assert.equal(ch.validateWebhook(envelope(),new Set(),secret),true));
test('assinatura adulterada falha',()=>assert.throws(()=>ch.validateWebhook(envelope({signature:'0'.repeat(64)}),new Set(),secret),/SIGNATURE/));
test('replay de webhook falha',()=>{const e=envelope();assert.throws(()=>ch.validateWebhook(e,new Set([e.nonce]),secret),/REPLAY/)});
test('webhook fora da janela falha',()=>assert.throws(()=>ch.validateWebhook(envelope({timestamp:0}),new Set(),secret),/WINDOW/));
test('segredo é exibido uma vez',()=>{const c=ch.issueCredential('x'.repeat(32));assert.equal(c.persistedValue,undefined);assert.equal(c.rotationRequired,true)});
