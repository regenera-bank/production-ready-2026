import { Injectable } from '@nestjs/common';
import { SignJWT } from 'jose';
import { SandboxKeysService } from '../sandbox/sandbox-keys.service';
import { PartnerApiException } from '../common/partner-api.exception';

@Injectable()
export class OAuthService {
  constructor(private readonly sandboxKeys: SandboxKeysService) {}

  async issueToken(input: {
    grantType: string;
    clientId: string;
    clientSecret: string;
    scope?: string;
    certificateThumbprint?: string;
  }): Promise<{
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    scope: string;
  }> {
    if (input.grantType !== 'client_credentials') {
      throw new PartnerApiException('RBK-AUTH-001', 401, 'Unsupported grant_type');
    }

    const key = this.sandboxKeys.validateCredentials(input.clientId, input.clientSecret);
    if (!key) {
      throw new PartnerApiException('RBK-AUTH-001', 401, 'Invalid client credentials');
    }

    const requestedScopes = (input.scope ?? key.scopes.join(' '))
      .split(' ')
      .filter(Boolean);
    const allowed = new Set(key.scopes);
    for (const scope of requestedScopes) {
      if (!allowed.has(scope)) {
        throw new PartnerApiException('RBK-AUTH-003', 403, `Scope not granted: ${scope}`);
      }
    }

    const secret = new TextEncoder().encode(
      process.env.PARTNER_JWT_SECRET ?? 'sandbox-only-change-in-production',
    );
    const issuer = process.env.PARTNER_JWT_ISSUER ?? 'https://sandbox.auth.regenerabank.example';
    const audience =
      process.env.PARTNER_JWT_AUDIENCE ?? 'https://sandbox.api.regenerabank.example';
    const expiresIn = 3600;

    const payload: Record<string, unknown> = {
      client_id: key.clientId,
      scope: requestedScopes.join(' '),
    };

    if (input.certificateThumbprint) {
      payload.cnf = { 'x5t#S256': input.certificateThumbprint };
    }

    const accessToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject(key.clientId)
      .setIssuedAt()
      .setExpirationTime(`${expiresIn}s`)
      .sign(secret);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: requestedScopes.join(' '),
    };
  }
}