import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ChannelIdentityService } from '@regenera/channel-persistence';
import { AuthService } from './auth.service';

const sampleAddress = {
  street: 'Av. Paulista',
  number: '1000',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  postalCode: '0130',
};

describe('AuthService (WEB-001)', () => {
  let auth: AuthService;
  let identity: ChannelIdentityService;

  beforeEach(() => {
    process.env.CHANNEL_IDENTITY_MEMORY = 'true';
    identity = new ChannelIdentityService();
    identity.onModuleInit();
    identity.reset();
    auth = new AuthService(identity);
  });

  it('KYC_PROVIDER=didit aceita cadastro mínimo CPF+senha', async () => {
    const prev = process.env.KYC_PROVIDER;
    process.env.KYC_PROVIDER = 'didit';
    try {
      const session = await auth.register({
        document: '39053344705',
        password: 'secret123',
      });
      expect(session.accessToken).toMatch(/^homolog-/);
      const user = auth.findUserById('39053344705');
      expect(user?.email).toBe('39053344705@didit.pending.regenera');
      expect(AuthService.isProfileComplete(user!)).toBe(true);
    } finally {
      if (prev === undefined) {
        delete process.env.KYC_PROVIDER;
      } else {
        process.env.KYC_PROVIDER = prev;
      }
    }
  });

  it('cadastra e autentica usuário com perfil completo', async () => {
    const session = await auth.register({
      document: '52998224725',
      password: 'secret12',
      displayName: 'Paulo Ricardo',
      email: 'paulo@regenera.bank',
      phone: '11999998888',
      birthDate: '1985-03-20',
      address: sampleAddress,
    });
    expect(session.accessToken).toMatch(/^homolog-/);
    expect(session.displayName).toBe('Paulo Ricardo');
    const login = await auth.createSession('529.982.247-25', 'secret12');
    expect(login.userId).toBe('52998224725');
    const user = auth.findUserById('52998224725');
    expect(user?.email).toBe('paulo@regenera.bank');
    expect(user?.address.city).toBe('São Paulo');
  });

  it('rejeita cadastro duplicado', async () => {
    await auth.register({
      document: '11144477735',
      password: 'abc12345',
      displayName: 'Teste',
      email: 't@x.com',
      phone: '11988887777',
      birthDate: '1992-01-01',
      address: sampleAddress,
    });
    await expect(
      auth.register({
        document: '11144477735',
        password: 'xyz12345',
        displayName: 'Outro',
        email: 'o@x.com',
        phone: '11977776666',
        birthDate: '1993-02-02',
        address: sampleAddress,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejeita credenciais vazias', async () => {
    await expect(auth.createSession('', '')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejeita login sem cadastro', async () => {
    await expect(auth.createSession('99999999999', 'x')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('revoga sessão e bloqueia reutilização', async () => {
    const session = await auth.register({
      document: '39053344705',
      password: 'secret12',
      displayName: 'Revoke Test',
      email: 'revoke@regenera.bank',
      phone: '11977776666',
      birthDate: '1988-06-10',
      address: sampleAddress,
    });
    auth.revokeSession(session.accessToken);
    await expect(auth.resolveSession(session.accessToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('recuperação de senha — resposta neutra para CPF inexistente', () => {
    const result = auth.requestPasswordReset('00000000000');
    expect(result.acknowledged).toBe(true);
    expect(result.message).toContain('cadastrado');
    expect(result.devToken).toBeUndefined();
  });

  it('recuperação de senha — fluxo completo homolog', async () => {
    await auth.register({
      document: '39053344705',
      password: 'old-secret',
      displayName: 'Reset Test',
      email: 'reset@test.com',
      phone: '11999990001',
      birthDate: '1990-05-10',
      address: sampleAddress,
    });

    const request = auth.requestPasswordReset('390.533.447-05');
    expect(request.devToken).toBeTruthy();

    auth.confirmPasswordReset(request.devToken!, 'new-secret-99');
    const session = await auth.createSession('39053344705', 'new-secret-99');
    expect(session.userId).toBe('39053344705');

    expect(() =>
      auth.confirmPasswordReset(request.devToken!, 'another-pass'),
    ).toThrow(UnauthorizedException);
  });

  it('recuperação de senha — rejeita token inválido', async () => {
    await auth.register({
      document: '98765432100',
      password: 'secret12',
      displayName: 'Token Inv',
      email: 'inv@test.com',
      phone: '11977776666',
      birthDate: '1991-01-01',
      address: sampleAddress,
    });
    expect(() =>
      auth.confirmPasswordReset('token-invalido', 'nova-senha-1'),
    ).toThrow(UnauthorizedException);
  });

  it('recuperação de senha — rejeita token expirado', async () => {
    await auth.register({
      document: '86427539581',
      password: 'secret12',
      displayName: 'Expirado',
      email: 'exp@test.com',
      phone: '11966665555',
      birthDate: '1992-02-02',
      address: sampleAddress,
    });
    const reset = auth.requestPasswordReset('86427539581');
    identity.mutate((draft) => {
      const hash = Object.keys(draft.passwordResetTokens ?? {})[0];
      const record = hash ? draft.passwordResetTokens?.[hash] : undefined;
      if (hash && record) {
        draft.passwordResetTokens![hash] = {
          ...record,
          expiresAt: new Date(Date.now() - 60_000).toISOString(),
        };
      }
    });
    expect(() =>
      auth.confirmPasswordReset(reset.devToken!, 'nova-senha-2'),
    ).toThrow(UnauthorizedException);
  });

  it('recuperação de senha — invalida sessão anterior', async () => {
    const session = await auth.register({
      document: '12345678909',
      password: 'before-reset',
      displayName: 'Sessão',
      email: 'sess@test.com',
      phone: '11988880002',
      birthDate: '1988-08-08',
      address: sampleAddress,
    });
    const reset = auth.requestPasswordReset('12345678909');
    auth.confirmPasswordReset(reset.devToken!, 'after-reset-1');
    await expect(auth.resolveSession(session.accessToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refresh rotaciona tokens e novo access resolve sessão', async () => {
    const session = await auth.register({
      document: '60746948030',
      password: 'secret-refresh',
      displayName: 'Refresh OK',
      email: 'refresh-ok@test.com',
      phone: '11955554444',
      birthDate: '1987-07-07',
      address: sampleAddress,
    });
    expect(session.refreshToken).toBeTruthy();

    const rotated = await auth.refreshSession(session.refreshToken!);
    expect(rotated.accessToken).not.toBe(session.accessToken);
    expect(rotated.refreshToken).not.toBe(session.refreshToken);

    const resolved = await auth.resolveSession(rotated.accessToken);
    expect(resolved.userId).toBe('60746948030');
    await expect(auth.resolveSession(session.accessToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('replay de refresh token antigo é rejeitado', async () => {
    const session = await auth.register({
      document: '94353272054',
      password: 'secret-replay',
      displayName: 'Refresh Replay',
      email: 'refresh-replay@test.com',
      phone: '11944443333',
      birthDate: '1986-06-06',
      address: sampleAddress,
    });
    const oldRefresh = session.refreshToken!;
    await auth.refreshSession(oldRefresh);
    await expect(auth.refreshSession(oldRefresh)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});