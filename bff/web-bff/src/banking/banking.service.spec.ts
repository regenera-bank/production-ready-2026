import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { CoreBankModule } from '../integrations/core-bank';
import { AddressService } from '../address/address.service';
import { DataValidClient } from '../integrations/risk-kyc/datavalid.client';
import { PrometeoIdentityClient } from '../integrations/risk-kyc/prometeo-identity.client';
import type { PepProvider } from '../integrations/risk-kyc/pep.provider';
import { RiskKycModule } from '../integrations/risk-kyc/risk-kyc.module';
import { createTestVisionAdapter } from '../integrations/risk-kyc/test-vision.mock';
import { OnboardingService } from '../onboarding/onboarding.service';
import { HomologStoreService } from '../persistence/homolog-store.service';
import { BankingService } from './banking.service';

const sampleAddress = {
  street: 'Rua A',
  number: '1',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  postalCode: '01000-000',
};

const seedKycApproved = (store: HomologStoreService, userId: string): void => {
  store.mutate((draft) => {
    draft.onboarding[userId] = {
      userId,
      kycStatus: 'APPROVED',
      accountStatus: 'NONE',
      kycStep: 'done',
      documentPhotoBase64: 'test-doc',
      kycApprovedAt: new Date().toISOString(),
    };
  });
};

const onboardingStubFactory = (store: HomologStoreService): OnboardingService =>
  ({
    requireKycApproved(userId: string): void {
      const record = store.get().onboarding[userId];
      if (!record || record.kycStatus !== 'APPROVED') {
        throw new ForbiddenException(
          'Conclua a verificação cadastral (KYC) primeiro',
        );
      }
    },
    requireActiveAccount(userId: string): void {
      const record = store.get().onboarding[userId];
      if (!record || record.accountStatus !== 'ACTIVE') {
        throw new ForbiddenException('Abra sua conta antes de operar');
      }
    },
    markAccountActive(userId: string): void {
      store.mutate((draft) => {
        const record = draft.onboarding[userId];
        if (!record || record.kycStatus !== 'APPROVED') {
          throw new ForbiddenException(
            'KYC deve estar aprovado antes da abertura',
          );
        }
        record.accountStatus = 'ACTIVE';
        record.accountOpenedAt = new Date().toISOString();
        record.kycStep = 'done';
      });
    },
    listActiveUserIds(): string[] {
      return Object.entries(store.get().onboarding)
        .filter(([, record]) => record.accountStatus === 'ACTIVE')
        .map(([userId]) => userId);
    },
  }) as OnboardingService;

describe('BankingService (WEB-001)', () => {
  let service: BankingService;
  let onboarding: OnboardingService;
  let auth: AuthService;
  let store: HomologStoreService;

  beforeEach(async () => {
    process.env.HOMOLOG_STORE_MEMORY = 'true';
    process.env.KYC_PROVIDER = 'homolog';
    process.env.CORE_BANK_STORAGE = 'memory';
    delete process.env.DATABASE_URL;
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RiskKycModule, CoreBankModule],
      providers: [
        HomologStoreService,
        AuthService,
        BankingService,
        {
          provide: OnboardingService,
          useFactory: onboardingStubFactory,
          inject: [HomologStoreService],
        },
      ],
    })
      .overrideProvider(AddressService)
      .useValue({
        lookupCep: async () => ({
          postalCode: '01000-000',
          street: 'Rua A',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          source: 'viacep',
        }),
      })
      .overrideProvider(PrometeoIdentityClient)
      .useValue({
        validateCpf: async (cpf: string) => ({
          found: true,
          basicData: {
            TaxIdNumber: cpf,
            TaxIdCountry: 'BRA',
            Name: 'Cliente Teste',
          },
          source: 'prometeo' as const,
        }),
      })
      .overrideProvider(DataValidClient)
      .useValue({
        validate: async () => ({ valid: true }),
        matchFacialBiometrics: async () => ({ score: 0.95, match: true }),
      })
      .overrideProvider('VISION_ADAPTER')
      .useValue(createTestVisionAdapter())
      .overrideProvider('PEP_PROVIDER')
      .useValue({
        check: async () => ({ isPep: false, score: 10 }),
      } satisfies PepProvider)
      .compile();
    store = moduleRef.get(HomologStoreService);
    store.onModuleInit();
    store.reset();
    service = moduleRef.get(BankingService);
    onboarding = moduleRef.get(OnboardingService);
    auth = moduleRef.get(AuthService);
    await service.onModuleInit();
  });

  const bootstrapUser = async (userId: string, document: string) => {
    auth.register({
      document,
      password: 'secret',
      displayName: 'Cliente Teste',
      email: `${userId}@test.com`,
      phone: '11999990000',
      birthDate: '1990-01-15',
      address: sampleAddress,
    });
    seedKycApproved(store, userId);
    const opened = await service.openCustomerAccount(userId);
    onboarding.markAccountActive(userId);
    return opened.accountId;
  };

  it('exige onboarding antes do dashboard', async () => {
    auth.register({
      document: '52998224725',
      password: 'secret',
      displayName: 'Paulo',
      email: 'p@t.com',
      phone: '11999990000',
      birthDate: '1988-06-10',
      address: sampleAddress,
    });
    await expect(service.getDashboard('52998224725')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('credita R$1 nas primeiras 30 contas homolog', async () => {
    await bootstrapUser('52998224725', '52998224725');
    const dashboard = await service.getDashboard('52998224725');
    expect(dashboard.currency).toBe('BRL');
    expect(BigInt(dashboard.balanceCents)).toBe(100n);
    expect(dashboard.maskedAccount).toMatch(/····/);
  });

  it('a partir da 31ª conta abre com saldo zero', async () => {
    store.mutate((draft) => {
      draft.banking.welcomeCreditAccountsOpened = 30;
    });
    await bootstrapUser('39053344705', '39053344705');
    const dashboard = await service.getDashboard('39053344705');
    expect(BigInt(dashboard.balanceCents)).toBe(0n);
  });

  it('rejeita Pix acima do crédito homolog de R$1', async () => {
    await bootstrapUser('11144477735', '11144477735');
    await bootstrapUser('52998224725', '52998224725');
    const debtor = await service.getDashboard('11144477735');
    expect(BigInt(debtor.balanceCents)).toBe(100n);
    await expect(
      service.sendPix('11144477735', '52998224725', 10_00n, 'pix-test-1'),
    ).rejects.toThrow();
  });

  it('executa Pix interno com crédito homolog de R$1', async () => {
    await bootstrapUser('11144477735', '11144477735');
    await bootstrapUser('52998224725', '52998224725');
    const result = await service.sendPix(
      '11144477735',
      '52998224725',
      50n,
      'pix-test-2',
    );
    expect(BigInt(result.amountCents)).toBe(50n);
    const debtor = await service.getDashboard('11144477735');
    const creditor = await service.getDashboard('52998224725');
    expect(BigInt(debtor.balanceCents)).toBe(50n);
    expect(BigInt(creditor.balanceCents)).toBe(150n);
  });
});