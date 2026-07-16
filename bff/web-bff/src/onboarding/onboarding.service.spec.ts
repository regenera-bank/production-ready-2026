import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { AddressService } from '../address/address.service';
import { DataValidClient } from '../integrations/risk-kyc/datavalid.client';
import { PrometeoIdentityClient } from '../integrations/risk-kyc/prometeo-identity.client';
import { RiskKycModule } from '../integrations/risk-kyc/risk-kyc.module';
import type { PepProvider } from '../integrations/risk-kyc/pep.provider';
import {
  createTestVisionAdapter,
  largeTestImageBase64,
} from '../integrations/risk-kyc/test-vision.mock';
import { BankingService } from '../banking/banking.service';
import { JourneyService } from '../journey/journey.service';
import { ChannelJourneyService } from '@regenera/channel-persistence';
import {
  initTestPersistence,
  testPersistenceProviders,
} from '../persistence/test-persistence';
import { DiditOnboardingService } from '../integrations/didit/didit-onboarding.service';
import type { NormalizedDiditKycResult } from '../integrations/didit/didit.types';
import { OnboardingService } from './onboarding.service';

const diditResult = (
  overrides: Pick<NormalizedDiditKycResult, 'decision' | 'rawStatus' | 'providerSessionId'> &
    Partial<NormalizedDiditKycResult>,
): NormalizedDiditKycResult => ({
  provider: 'DIDIT',
  trustedDecision: true,
  requiresRefetch: false,
  warnings: [],
  features: {
    document: 'UNKNOWN',
    nfc: 'UNKNOWN',
    liveness: 'UNKNOWN',
    faceMatch: 'UNKNOWN',
    poa: 'UNKNOWN',
    aml: 'UNKNOWN',
    ip: 'UNKNOWN',
    email: 'UNKNOWN',
    phone: 'UNKNOWN',
    database: 'UNKNOWN',
    questionnaire: 'UNKNOWN',
  },
  evidence: {
    sessionHash: 'hash',
    source: 'retrieve-session',
    capturedAt: new Date().toISOString(),
  },
  ...overrides,
});

const mockAddressLookup = {
  lookupCep: async (cep: string) => ({
    postalCode: cep.includes('01000') ? '01000-000' : '0130',
    street: 'Rua das Flores',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    source: 'viacep' as const,
  }),
};

const testPrometeo = {
  validateCpf: async (cpf: string) => ({
    found: true,
    basicData: {
      TaxIdNumber: cpf,
      TaxIdCountry: 'BRA',
      Name: 'Paulo Ricardo',
    },
    source: 'prometeo' as const,
  }),
};

const testDataValid = {
  validate: async () => ({ valid: true }),
  matchFacialBiometrics: async () => ({ score: 0.95, match: true }),
};

const testVision = createTestVisionAdapter();

const testPep: PepProvider = {
  check: async () => ({ isPep: false, score: 10 }),
};

const testDiditOnboarding = {
  createSession: jest.fn(),
  syncStatus: jest.fn(),
  handleWebhook: jest.fn(),
};

const sampleAddress = {
  street: 'Rua das Flores',
  number: '100',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  postalCode: '01310000',
};

const documentImageBase64 = largeTestImageBase64(0xab);
const selfieImageBase64 = largeTestImageBase64(0xcd);

describe('OnboardingService (fase-A + risk-kyc)', () => {
  let auth: AuthService;
  let onboarding: OnboardingService;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.KYC_PROVIDER = 'homolog';
    moduleRef = await Test.createTestingModule({
      imports: [RiskKycModule],
      providers: [
        ...testPersistenceProviders,
        AuthService,
        OnboardingService,
        {
          provide: BankingService,
          useValue: { syncPixDisplayName: jest.fn() },
        },
        {
          provide: JourneyService,
          useValue: { bumpVersionForUser: jest.fn() },
        },
        {
          provide: DiditOnboardingService,
          useValue: testDiditOnboarding,
        },
      ],
    })
      .overrideProvider(AddressService)
      .useValue(mockAddressLookup)
      .overrideProvider(PrometeoIdentityClient)
      .useValue(testPrometeo)
      .overrideProvider(DataValidClient)
      .useValue(testDataValid)
      .overrideProvider('VISION_ADAPTER')
      .useValue(testVision)
      .overrideProvider('PEP_PROVIDER')
      .useValue(testPep)
      .compile();
    await initTestPersistence(moduleRef);
    auth = moduleRef.get(AuthService);
    onboarding = moduleRef.get(OnboardingService);
  });

  const registerUser = async (document: string, name: string) => {
    await auth.register({
      document,
      password: 'secret12',
      displayName: name,
      email: 'user@test.com',
      phone: '11999998888',
      birthDate: '1990-05-15',
      address: sampleAddress,
    });
  };

  it('inicia com KYC pendente na etapa cadastral', async () => {
    await registerUser('52998224725', 'Paulo Ricardo');
    const status = onboarding.getStatus('52998224725');
    expect(status.kycStatus).toBe('PENDING');
    expect(status.kycStep).toBe('cadastral');
  });

  it('executa pipeline KYC real até aprovação', async () => {
    await registerUser('52998224725', 'Paulo Ricardo');
    const step1 = await onboarding.submitKyc('52998224725');
    expect(step1.kycStep).toBe('document');
    expect(step1.identitySource).toBe('firebase-homolog');

    const step2 = await onboarding.submitDocument(
      '52998224725',
      documentImageBase64,
      'RG',
    );
    expect(step2.kycStep).toBe('selfie');

    const step3 = await onboarding.submitSelfie('52998224725', selfieImageBase64);
    expect(step3.kycStatus).toBe('APPROVED');
    expect(step3.kycStep).toBe('done');
  });

  it('rejeita CPF em lista restritiva', async () => {
    await registerUser('00000000000', 'Bloqueado');
    const status = await onboarding.submitKyc('00000000000');
    expect(status.kycStatus).toBe('REJECTED');
    expect(status.kycReason).toBe('RESTRICTIVE_LIST_MATCH');
  });

  it('KYC_PROVIDER=didit inicia direto em didit_verification', async () => {
    process.env.KYC_PROVIDER = 'didit';
    process.env.DIDIT_API_KEY = 'test-didit-key';
    await registerUser('39053344705', 'Maria Didit');
    const status = onboarding.getStatus('39053344705');
    expect(status.kycStep).toBe('didit_verification');
    expect(status.identitySource).toBe('didit');
    expect(status.kycProvider).toBe('didit');
    const afterSubmit = await onboarding.submitKyc('39053344705');
    expect(afterSubmit.kycStep).toBe('didit_verification');
  });

  it('applyDiditResult mantém didit_verification em PROCESSING e MANUAL_REVIEW', async () => {
    process.env.KYC_PROVIDER = 'didit';
    await registerUser('39053344705', 'Maria Didit');
    const userId = '39053344705';
    onboarding.saveDiditSession({
      userId,
      vendorData: 'regenera:user:39053344705',
      sessionId: 'sess_proc',
      url: 'https://verify.didit.me/sess_proc',
      status: 'In Progress',
      workflowId: 'wf_test',
      documentType: 'RG',
      documentFormat: 'physical',
    });

    const processing = onboarding.applyDiditResult({
      userId,
      eventId: 'evt:processing:1',
      result: diditResult({
        providerSessionId: 'sess_proc',
        rawStatus: 'In Progress',
        decision: 'PROCESSING',
      }),
    });
    expect(processing.kycStep).toBe('didit_verification');
    expect(processing.kycStatus).toBe('IN_REVIEW');
    expect(processing.diditSessionUrl).toBe('https://verify.didit.me/sess_proc');

    const manual = onboarding.applyDiditResult({
      userId,
      eventId: 'evt:manual:1',
      result: diditResult({
        providerSessionId: 'sess_proc',
        rawStatus: 'In Review',
        decision: 'MANUAL_REVIEW',
      }),
    });
    expect(manual.kycStep).toBe('didit_verification');
    expect(manual.kycReason).toBe('DIDIT_MANUAL_REVIEW');
  });

  it('applyDiditResult limpa sessão em ABANDONED e resetDiditKyc permite nova tentativa', async () => {
    process.env.KYC_PROVIDER = 'didit';
    await registerUser('39053344705', 'Maria Didit');
    const userId = '39053344705';
    onboarding.saveDiditSession({
      userId,
      vendorData: 'regenera:user:39053344705',
      sessionId: 'sess_old',
      url: 'https://verify.didit.me/sess_old',
      status: 'Abandoned',
      workflowId: 'wf_test',
      documentType: 'CNH',
      documentFormat: 'physical',
    });

    const abandoned = onboarding.applyDiditResult({
      userId,
      eventId: 'evt:abandoned:1',
      result: diditResult({
        providerSessionId: 'sess_old',
        rawStatus: 'Abandoned',
        decision: 'ABANDONED',
      }),
    });
    expect(abandoned.kycStep).toBe('didit_verification');
    expect(abandoned.kycStatus).toBe('PENDING');
    expect(abandoned.diditSessionId).toBeUndefined();
    expect(abandoned.diditSessionUrl).toBeUndefined();

    const reset = onboarding.resetDiditKyc(userId);
    expect(reset.kycStep).toBe('didit_verification');
    expect(reset.kycStatus).toBe('PENDING');
    expect(reset.diditSessionId).toBeUndefined();
  });

  it('createDiditSession retoma sessão ativa sem criar nova', async () => {
    process.env.KYC_PROVIDER = 'didit';
    await registerUser('39053344705', 'Maria Didit');
    const userId = '39053344705';
    onboarding.saveDiditSession({
      userId,
      vendorData: 'regenera:user:39053344705',
      sessionId: 'sess_resume',
      url: 'https://verify.didit.me/sess_resume',
      status: 'In Progress',
      workflowId: 'wf_test',
      documentType: 'RG',
      documentFormat: 'physical',
    });

    const resumed = await onboarding.createDiditSession(userId, {
      documentType: 'RG',
      documentFormat: 'physical',
    });
    expect(resumed.sessionId).toBe('sess_resume');
    expect(resumed.url).toBe('https://verify.didit.me/sess_resume');
    expect(testDiditOnboarding.createSession).not.toHaveBeenCalled();
  });

  it('homolog firebase exige documento e selfie antes de aprovar', async () => {
    process.env.KYC_PROVIDER = 'firebase';
    await registerUser('39053344705', 'Maria Homolog');
    const step1 = await onboarding.submitKyc('39053344705');
    expect(step1.kycStep).toBe('document');
    expect(step1.identitySource).toBe('firebase-homolog');

    const step2 = await onboarding.submitDocument(
      '39053344705',
      documentImageBase64,
      'RG',
    );
    expect(step2.kycStep).toBe('selfie');

    const step3 = await onboarding.submitSelfie('39053344705', selfieImageBase64);
    expect(step3.kycStatus).toBe('APPROVED');
    expect(step3.kycStep).toBe('done');
  });

  it('permite reiniciar documento/selfie após rejeição biométrica em homolog', async () => {
    await registerUser('52998224725', 'Paulo Ricardo');
    const journey = moduleRef.get(ChannelJourneyService);
    journey.mutate((draft) => {
      draft.onboarding['52998224725'] = {
        userId: '52998224725',
        kycStatus: 'REJECTED',
        accountStatus: 'NONE',
        kycStep: 'selfie',
        kycReason: 'LOW_SIMILARITY_SCORE',
        documentAssetId: 'doc_legacy_test',
      };
    });
    const reset = onboarding.resetBiometricKyc('52998224725');
    expect(reset.kycStatus).toBe('IN_REVIEW');
    expect(reset.kycStep).toBe('document');
    expect(reset.kycReason).toBeUndefined();
  });

  it('permite reiniciar KYC após rejeição cadastral recuperável', async () => {
    await registerUser('52998224725', 'Paulo Ricardo');
    const journey = moduleRef.get(ChannelJourneyService);
    journey.mutate((draft) => {
      draft.onboarding['52998224725'] = {
        userId: '52998224725',
        kycStatus: 'REJECTED',
        accountStatus: 'NONE',
        kycStep: 'cadastral',
        kycReason: 'IDENTITY_NOT_FOUND',
      };
    });
    const reset = onboarding.resetCadastralKyc('52998224725');
    expect(reset.kycStatus).toBe('PENDING');
    expect(reset.kycStep).toBe('cadastral');
  });

  it('bloqueia abertura sem KYC aprovado', async () => {
    await registerUser('11144477735', 'Teste');
    expect(() => onboarding.markAccountActive('11144477735')).toThrow(
      ForbiddenException,
    );
  });

  it('heal legacy APPROVED sem documentAssetId', async () => {
    const legacyId = '86873574051';
    await registerUser(legacyId, 'Legacy Heal E2E');
    const journey = moduleRef.get(ChannelJourneyService);
    journey.mutate((draft) => {
      draft.onboarding[legacyId] = {
        userId: legacyId,
        kycStatus: 'APPROVED',
        accountStatus: 'NONE',
        kycStep: 'done',
      };
    });

    const status = onboarding.getStatus(legacyId);
    expect(status.kycStatus).toBe('IN_REVIEW');
    expect(status.kycStep).toBe('document');
    expect(status.kycReason).toBe('KYC_LEGACY_RESET');

    const persisted = journey.get().onboarding[legacyId];
    expect(persisted.kycStatus).toBe('IN_REVIEW');
    expect(persisted.kycStep).toBe('document');
    expect(persisted.kycReason).toBe('KYC_LEGACY_RESET');
  });
});