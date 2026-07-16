import { OAuthService } from './oauth.service';
import { SandboxKeysService } from '../sandbox/sandbox-keys.service';
import { PartnerApiException } from '../common/partner-api.exception';

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuer: jest.fn().mockReturnThis(),
    setAudience: jest.fn().mockReturnThis(),
    setSubject: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-access-token'),
  })),
}));

describe('OAuthService', () => {
  const service = new OAuthService(new SandboxKeysService());

  it('issues token for default sandbox credentials', async () => {
    const token = await service.issueToken({
      grantType: 'client_credentials',
      clientId: 'sandbox-client-001',
      clientSecret: 'sandbox-secret-001',
    });

    expect(token.token_type).toBe('Bearer');
    expect(token.access_token).toBe('mock-access-token');
    expect(token.scope).toContain('pix:write');
  });

  it('rejects invalid credentials', async () => {
    await expect(
      service.issueToken({
        grantType: 'client_credentials',
        clientId: 'sandbox-client-001',
        clientSecret: 'wrong',
      }),
    ).rejects.toBeInstanceOf(PartnerApiException);
  });
});