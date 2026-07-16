import { ChannelIdentityService } from './channel-identity.service';

describe('ChannelIdentityService', () => {
  let identity: ChannelIdentityService;

  beforeEach(() => {
    process.env.CHANNEL_IDENTITY_MEMORY = 'true';
    identity = new ChannelIdentityService();
    identity.onModuleInit();
    identity.reset();
  });

  it('persiste usuário e sessão em memória', () => {
    identity.mutate((draft) => {
      draft.users['52998224725'] = {
        userId: '52998224725',
        document: '52998224725',
        password: 'hash',
        displayName: 'Teste',
        email: 't@x.com',
        phone: '11999990000',
        birthDate: '1990-01-01',
        address: {
          street: 'Rua A',
          number: '1',
          neighborhood: 'Centro',
          city: 'SP',
          state: 'SP',
          postalCode: '01000000',
        },
        createdAt: new Date().toISOString(),
      };
      draft.sessions['homolog-abc'] = {
        accessToken: 'homolog-abc',
        userId: '52998224725',
        displayName: 'Teste',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      };
    });
    const snap = identity.get();
    expect(snap.users['52998224725']?.displayName).toBe('Teste');
    expect(snap.sessions['homolog-abc']?.userId).toBe('52998224725');
  });

  it('reset limpa identidade', () => {
    identity.mutate((draft) => {
      draft.users['x'] = {
        userId: 'x',
        document: 'x',
        password: '',
        displayName: 'X',
        email: 'x@x.com',
        phone: '1',
        address: {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          postalCode: '',
        },
        createdAt: new Date().toISOString(),
      };
    });
    identity.reset();
    expect(Object.keys(identity.get().users)).toHaveLength(0);
  });
});