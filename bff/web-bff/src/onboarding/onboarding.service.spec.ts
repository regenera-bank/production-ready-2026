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
import { HomologStoreService } from '../persistence/homolog-store.service';
import { OnboardingService } from './onboarding.service';

const mockAddressLookup = {
  lookupCep: async (cep: string) => ({
    postalCode: cep.includes('01000') ? '01000-000' : '01310-100',
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

const sampleAddress = {
  street: 'Rua das Flores',
  number: '100',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  postalCode: '01310-100',
};

const documentImageBase64 = largeTestImageBase64(0xab);
const selfieImageBase64 = largeTestImageBase64(0xcd);

describe('OnboardingService (ONDA-A + risk-kyc)', () => {
  let auth: AuthService;
  let onboarding: OnboardingService;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    process.env.HOMOLOG_STORE_MEMORY = 'true';
    process.env.KYC_PROVIDER = 'homolog';
    moduleRef = await Test.createTestingModule({
      imports: [RiskKycModule],
      providers: [
        HomologStoreService,
        AuthService,
        OnboardingService,
        {
          provide: BankingService,
          useValue: { syncPixDisplayName: jest.fn() },
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
    const store = moduleRef.get(HomologStoreService);
    store.onModuleInit();
    store.reset();
    auth = moduleRef.get(AuthService);
    onboarding = moduleRef.get(OnboardingService);
  });

  const registerUser = (document: string, name: string) => {
    auth.register({
      document,
      password: 'secret',
      displayName: name,
      email: 'user@test.com',
      phone: '11999998888',
      birthDate: '1990-05-15',
      address: sampleAddress,
    });
  };

  it('inicia com KYC pendente na etapa cadastral', () => {
    registerUser('52998224725', 'Paulo Ricardo');
    const status = onboarding.getStatus('52998224725');
    expect(status.kycStatus).toBe('PENDING');
    expect(status.kycStep).toBe('cadastral');
  });

  it('executa pipeline KYC real até aprovação', async () => {
    registerUser('52998224725', 'Paulo Ricardo');
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
    registerUser('00000000000', 'Bloqueado');
    const status = await onboarding.submitKyc('00000000000');
    expect(status.kycStatus).toBe('REJECTED');
    expect(status.kycReason).toBe('RESTRICTIVE_LIST_MATCH');
  });

  it('homolog firebase exige documento e selfie antes de aprovar', async () => {
    process.env.KYC_PROVIDER = 'firebase';
    registerUser('39053344705', 'Maria Homolog');
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

  it('permite reiniciar KYC após rejeição cadastral recuperável', () => {
    registerUser('52998224725', 'Paulo Ricardo');
    const store = moduleRef.get(HomologStoreService);
    store.mutate((draft) => {
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

  it('bloqueia abertura sem KYC aprovado', () => {
    registerUser('11144477735', 'Teste');
    expect(() => onboarding.markAccountActive('11144477735')).toThrow(
      ForbiddenException,
    );
  });
});