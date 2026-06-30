declare function require(name: string): any;
const { createHmac, timingSafeEqual } = require('node:crypto');
const { Buffer } = require('node:buffer');

export interface PartnerSession { certificateFingerprint: string; scopes: string[]; expiresAt: string }
export interface WebhookEnvelope { id: string; timestamp: number; nonce: string; signature: string; body: string }

const FP=/^[A-F0-9]{64}$/;
const NONCE=/^[A-Za-z0-9_-]{16,128}$/;
const SIGNATURE=/^[a-f0-9]{64}$/;
const MAX_BODY_BYTES=1024*1024;

export function authorizePartner(session: PartnerSession, requiredScope: string, nowMs=Date.now()): true {
  if (!FP.test(session.certificateFingerprint)) throw new Error('MTLS_FINGERPRINT_INVALID');
  if (Date.parse(session.expiresAt) <= nowMs) throw new Error('PARTNER_SESSION_EXPIRED');
  if (!session.scopes.includes(requiredScope)) throw new Error('PARTNER_SCOPE_DENIED');
  return true;
}

export function signWebhook(body:string, timestamp:number, nonce:string, secret:string):string {
  if (secret.length<32) throw new Error('WEBHOOK_SECRET_TOO_SHORT');
  return createHmac('sha256',secret).update(`${timestamp}.${nonce}.${body}`,'utf8').digest('hex');
}

export function validateWebhook(envelope: WebhookEnvelope, seenNonces: ReadonlySet<string>, secret:string, nowMs=Date.now()): true {
  if (!envelope.id) throw new Error('WEBHOOK_ID_REQUIRED');
  if (!NONCE.test(envelope.nonce)) throw new Error('WEBHOOK_NONCE_INVALID');
  if (seenNonces.has(envelope.nonce)) throw new Error('WEBHOOK_REPLAY');
  if (Math.abs(nowMs-envelope.timestamp)>300000) throw new Error('WEBHOOK_TIMESTAMP_OUTSIDE_WINDOW');
  if (Buffer.byteLength(envelope.body,'utf8')>MAX_BODY_BYTES) throw new Error('WEBHOOK_BODY_TOO_LARGE');
  if (!SIGNATURE.test(envelope.signature)) throw new Error('WEBHOOK_SIGNATURE_INVALID');

  const expected=signWebhook(envelope.body,envelope.timestamp,envelope.nonce,secret);
  const received=Buffer.from(envelope.signature,'hex');
  const expectedBuffer=Buffer.from(expected,'hex');
  if (received.length!==expectedBuffer.length || !timingSafeEqual(received,expectedBuffer)) throw new Error('WEBHOOK_SIGNATURE_INVALID');
  return true;
}

export function issueCredential(secret: string) {
  if (secret.length < 32) throw new Error('CREDENTIAL_TOO_SHORT');
  return Object.freeze({ displayOnce: secret, persistedValue: undefined, rotationRequired: true });
}
