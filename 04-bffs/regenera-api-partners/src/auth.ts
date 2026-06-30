import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import type { TLSSocket } from 'node:tls';
import { config } from './config.js';

const jwks = createRemoteJWKSet(new URL(config.JWKS_URL));

export type Principal = {
  subject: string;
  clientId: string;
  scopes: Set<string>;
  certificateFingerprint: string;
};

function certificateThumbprint(socket: TLSSocket): string {
  const certificate = socket.getPeerCertificate(true);
  if (!socket.authorized || !certificate?.raw?.length || !certificate.fingerprint256) {
    throw Object.assign(new Error('MTLS_REQUIRED'), { statusCode: 401 });
  }
  return createHash('sha256').update(certificate.raw).digest('base64url');
}

function equal(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function authenticate(request: FastifyRequest): Promise<Principal> {
  const thumbprint = certificateThumbprint(request.socket as TLSSocket);
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw Object.assign(new Error('BEARER_REQUIRED'), { statusCode: 401 });
  }

  const { payload } = await jwtVerify(authorization.slice(7), jwks, {
    issuer: config.OIDC_ISSUER,
    audience: config.OIDC_AUDIENCE,
    algorithms: ['RS256', 'PS256', 'ES256']
  });

  const cnf = payload.cnf as { 'x5t#S256'?: string } | undefined;
  if (!cnf?.['x5t#S256'] || !equal(cnf['x5t#S256'], thumbprint)) {
    throw Object.assign(new Error('CERTIFICATE_TOKEN_BINDING_REQUIRED'), { statusCode: 401 });
  }

  const clientId = String(payload.client_id ?? payload.azp ?? '');
  if (!clientId) {
    throw Object.assign(new Error('CLIENT_ID_REQUIRED'), { statusCode: 401 });
  }

  const scope = typeof payload.scope === 'string' ? payload.scope.split(' ') : [];
  return {
    subject: String(payload.sub),
    clientId,
    scopes: new Set(scope),
    certificateFingerprint: thumbprint
  };
}

export function requireScope(principal: Principal, scope: string) {
  if (!principal.scopes.has(scope)) {
    throw Object.assign(new Error('INSUFFICIENT_SCOPE'), { statusCode: 403 });
  }
}
