const test=require('node:test');
const assert=require('node:assert/strict');
const ch=require('../dist/channel.js');
const base={id:'a1',maker:'operator-a',reason:'bloqueio cautelar',evidence:['ticket-1']};

test('autoaprovação falha',()=>assert.throws(()=>ch.approve(base,'operator-a'),/SELF_APPROVAL/));
test('evidência é obrigatória',()=>assert.throws(()=>ch.approve({...base,evidence:[]},'operator-b'),/EVIDENCE/));
test('ação expirada falha',()=>assert.throws(()=>ch.approve({...base,expiresAt:'2020-01-01T00:00:00Z'},'operator-b'),/EXPIRED/));
test('PII nasce mascarada',()=>assert.equal(ch.maskPii('12345678900'),'12***00'));
test('auditoria usa SHA-256 e encadeia',()=>{const a=ch.appendAudit([],{actionId:'a1',actor:'x',decision:'REQUESTED'});const b=ch.appendAudit(a,{actionId:'a1',actor:'y',decision:'APPROVED'});assert.equal(b[1].previousHash,b[0].hash);assert.equal(b[1].hash.length,64);assert.equal(ch.verifyAudit(b),true)});
test('adulteração da trilha é detectada',()=>{const a=ch.appendAudit([],{actionId:'a1',actor:'x',decision:'REQUESTED'});const corrupt=[{...a[0],actor:'z'}];assert.equal(ch.verifyAudit(corrupt),false)});
