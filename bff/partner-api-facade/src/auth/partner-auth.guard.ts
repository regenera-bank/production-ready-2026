import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { jwtVerify } from 'jose';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { PartnerPrincipal } from './principal.types';
import { PartnerApiException } from '../common/partner-api.exception';
import { mtlsConfigSpec } from '../common/mtls.config';

function equal(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

@Injectable()
export class PartnerAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      socket: {
        getPeerCertificate?: () => { fingerprint256?: string; raw?: Buffer; authorized?: boolean };
        authorized?: boolean;
      };
      principal?: PartnerPrincipal;
      mtlsThumbprint?: string;
    }>();

    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new PartnerApiException('RBK-AUTH-001', 401, 'Bearer token required');
    }

    const secret = new TextEncoder().encode(
      process.env.PARTNER_JWT_SECRET ?? 'sandbox-only-change-in-production',
    );

    const { payload } = await jwtVerify(authorization.slice(7), secret, {
      issuer: process.env.PARTNER_JWT_ISSUER ?? 'https://sandbox.auth.regenerabank.example',
      audience: process.env.PARTNER_JWT_AUDIENCE ?? 'https://sandbox.api.regenerabank.example',
    });

    const spec = mtlsConfigSpec();
    let certificateThumbprint: string | undefined = request.mtlsThumbprint;

    if (spec.required) {
      const socket = request.socket;
      const certificate = socket.getPeerCertificate?.();
      if (!socket.authorized || !certificate?.raw?.length || !certificate.fingerprint256) {
        throw new PartnerApiException('RBK-AUTH-001', 401, 'mTLS client certificate required');
      }
      certificateThumbprint = createHash('sha256')
        .update(certificate.raw)
        .digest('base64url');

      const cnf = payload.cnf as { 'x5t#S256'?: string } | undefined;
      if (!cnf?.['x5t#S256'] || !equal(cnf['x5t#S256'], certificateThumbprint)) {
        throw new PartnerApiException('RBK-AUTH-001', 401, 'Certificate token binding required');
      }
    }

    const clientId = String(payload.client_id ?? payload.azp ?? '');
    if (!clientId) {
      throw new PartnerApiException('RBK-AUTH-001', 401, 'client_id required in token');
    }

    const scope =
      typeof payload.scope === 'string' ? payload.scope.split(' ').filter(Boolean) : [];

    request.principal = {
      subject: String(payload.sub),
      clientId,
      scopes: new Set(scope),
      certificateThumbprint,
    };

    return true;
  }
}