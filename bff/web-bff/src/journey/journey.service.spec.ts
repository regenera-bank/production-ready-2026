import { Test, TestingModule } from '@nestjs/testing';
import { ChannelJourneyService } from '@regenera/channel-persistence';
import { AuthService } from '../auth/auth.service';
import {
  initTestPersistence,
  testPersistenceProviders,
} from '../persistence/test-persistence';
import { OnboardingService } from '../onboarding/onboarding.service';
import { JourneyService } from './journey.service';

describe('JourneyService', () => {
  let journeys: JourneyService;
  let journeyStore: ChannelJourneyService;
  let auth: AuthService;

  const onboardingStub = {
    initForUser: jest.fn(),
    getStatus: jest.fn().mockReturnValue({
      kycStatus: 'PENDING',
      kycStep: 'cadastral',
      accountStatus: 'NONE',
    }),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        JourneyService,
        AuthService,
        ...testPersistenceProviders,
        { provide: OnboardingService, useValue: onboardingStub },
      ],
    }).compile();

    journeys = moduleRef.get(JourneyService);
    ({ journey: journeyStore } = await initTestPersistence(moduleRef));
    auth = moduleRef.get(AuthService);
    jest.clearAllMocks();
  });

  const registerUser = async (document: string, name: string) => {
    await auth.register({
      document,
      password: 'SecretForte1!',
      displayName: name,
      email: 'user@test.com',
      phone: '11999998888',
      birthDate: '1990-05-15',
      address: {
        street: 'Rua das Flores',
        number: '100',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '0130',
      },
    });
  };

  it('cria jornada com journeyId e estados canônicos', async () => {
    await registerUser('52998224725', 'Paulo Ricardo');
    const created = await journeys.createForUser('52998224725', {
      channel: 'WEB',
      deviceId: 'dev_test_01',
      locale: 'pt-BR',
    });
    expect(created.journeyId).toMatch(/^jrn_/);
    expect(created.currentState).toBe('PERSONAL_DATA_PENDING');
    expect(created.allowedActions).toContain('PUT_PERSONAL_DATA');
    expect(journeyStore.get().journeyActiveByUserId?.['52998224725']).toBe(
      created.journeyId,
    );
  });

  it('bumpVersionForUser incrementa versão da jornada ativa', async () => {
    await registerUser('11144477735', 'Bump Version');
    await journeys.createForUser('11144477735', {
      channel: 'WEB',
      deviceId: 'dev_bump',
    });
    journeys.bumpVersionForUser('11144477735');
    const active = journeys.getActiveForUser('11144477735');
    expect(active?.version).toBe(2);
  });

  it('reutiliza jornada ativa do mesmo usuário', async () => {
    await registerUser('39053344705', 'Maria Homolog');
    const first = await journeys.createForUser('39053344705', {
      channel: 'WEB',
      deviceId: 'dev_test_02',
    });
    const second = await journeys.createForUser('39053344705', {
      channel: 'WEB',
      deviceId: 'dev_test_02',
    });
    expect(second.journeyId).toBe(first.journeyId);
  });
});