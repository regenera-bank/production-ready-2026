import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { HomologStoreService } from '../persistence/homolog-store.service';
import { AuthService } from './auth.service';

const sampleAddress = {
  street: 'Av. Paulista',
  number: '1000',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  postalCode: '01310-100',
};

describe('AuthService (WEB-001)', () => {
  let auth: AuthService;
  let store: HomologStoreService;

  beforeEach(() => {
    process.env.HOMOLOG_STORE_MEMORY = 'true';
    store = new HomologStoreService();
    store.onModuleInit();
    store.reset();
    auth = new AuthService(store);
  });

  it('cadastra e autentica usuário com perfil completo', () => {
    const session = auth.register({
      document: '52998224725',
      password: 'secret',
      displayName: 'Paulo Ricardo',
      email: 'paulo@regenera.bank',
      phone: '11999998888',
      birthDate: '1985-03-20',
      address: sampleAddress,
    });
    expect(session.accessToken).toMatch(/^homolog-/);
    expect(session.displayName).toBe('Paulo Ricardo');
    const login = auth.createSession('529.982.247-25', 'secret');
    expect(login.userId).toBe('52998224725');
    const user = auth.findUserById('52998224725');
    expect(user?.email).toBe('paulo@regenera.bank');
    expect(user?.address.city).toBe('São Paulo');
  });

  it('rejeita cadastro duplicado', () => {
    auth.register({
      document: '11144477735',
      password: 'abc',
      displayName: 'Teste',
      email: 't@x.com',
      phone: '11988887777',
      birthDate: '1992-01-01',
      address: sampleAddress,
    });
    expect(() =>
      auth.register({
        document: '11144477735',
        password: 'xyz',
        displayName: 'Outro',
        email: 'o@x.com',
        phone: '11977776666',
        birthDate: '1993-02-02',
        address: sampleAddress,
      }),
    ).toThrow(ConflictException);
  });

  it('rejeita credenciais vazias', () => {
    expect(() => auth.createSession('', '')).toThrow(UnauthorizedException);
  });

  it('rejeita login sem cadastro', () => {
    expect(() => auth.createSession('99999999999', 'x')).toThrow(
      UnauthorizedException,
    );
  });

  it('recuperação de senha — resposta neutra para CPF inexistente', () => {
    const result = auth.requestPasswordReset('00000000000');
    expect(result.acknowledged).toBe(true);
    expect(result.message).toContain('cadastrado');
    expect(result.devToken).toBeUndefined();
  });

  it('recuperação de senha — fluxo completo homolog', () => {
    auth.register({
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
    const session = auth.createSession('39053344705', 'new-secret-99');
    expect(session.userId).toBe('39053344705');

    expect(() =>
      auth.confirmPasswordReset(request.devToken!, 'another-pass'),
    ).toThrow(UnauthorizedException);
  });

  it('recuperação de senha — rejeita token inválido', () => {
    auth.register({
      document: '98765432100',
      password: 'secret',
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

  it('recuperação de senha — rejeita token expirado', () => {
    auth.register({
      document: '86427539581',
      password: 'secret',
      displayName: 'Expirado',
      email: 'exp@test.com',
      phone: '11966665555',
      birthDate: '1992-02-02',
      address: sampleAddress,
    });
    const reset = auth.requestPasswordReset('86427539581');
    store.mutate((draft) => {
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

  it('recuperação de senha — invalida sessão anterior', () => {
    const session = auth.register({
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
    expect(() => auth.resolveSession(session.accessToken)).toThrow(
      UnauthorizedException,
    );
  });
});