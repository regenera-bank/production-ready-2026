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
import { PaymentSettlementPublisher } from '../projections/payment-settlement.publisher';
import { ChannelBankingService, ChannelJourneyService } from '@regenera/channel-persistence';
import {
  initTestPersistence,
  testPersistenceProviders,
} from '../persistence/test-persistence';
import { BankingService } from './banking.service';

const sampleAddress = {
  street: 'Rua A',
  number: '1',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  postalCode: '01000-000',
};

const seedKycApproved = (journey: ChannelJourneyService, userId: string): void => {
  journey.mutate((draft) => {
    draft.onboarding[userId] = {
      userId,
      kycStatus: 'APPROVED',
      accountStatus: 'NONE',
      kycStep: 'done',
      documentAssetId: 'doc_test_seed',
      kycApprovedAt: new Date().toISOString(),
    };
  });
};

const onboardingStubFactory = (journey: ChannelJourneyService): OnboardingService =>
  ({
    requireKycApproved(userId: string): void {
      const record = journey.get().onboarding[userId];
      if (!record || record.kycStatus !== 'APPROVED') {
        throw new ForbiddenException(
          'Conclua a verificação cadastral (KYC) primeiro',
        );
      }
    },
    requireActiveAccount(userId: string): void {
      const record = journey.get().onboarding[userId];
      if (!record || record.accountStatus !== 'ACTIVE') {
        throw new ForbiddenException('Abra sua conta antes de operar');
      }
    },
    markAccountActive(userId: string): void {
      journey.mutate((draft) => {
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
      return Object.entries(journey.get().onboarding)
        .filter(([, record]) => record.accountStatus === 'ACTIVE')
        .map(([userId]) => userId);
    },
  }) as OnboardingService;

describe('BankingService (WEB-001)', () => {
  let service: BankingService;
  let onboarding: OnboardingService;
  let auth: AuthService;
  let journeyStore: ChannelJourneyService;
  let channelBanking: ChannelBankingService;

  beforeEach(async () => {
    process.env.KYC_PROVIDER = 'homolog';
    process.env.CORE_BANK_STORAGE = 'memory';
    delete process.env.DATABASE_URL;
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RiskKycModule, CoreBankModule.forRoot('memory')],
      providers: [
        ...testPersistenceProviders,
        AuthService,
        PaymentSettlementPublisher,
        BankingService,
        {
          provide: OnboardingService,
          useFactory: onboardingStubFactory,
          inject: [ChannelJourneyService],
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
    ({ journey: journeyStore, banking: channelBanking } = await initTestPersistence(moduleRef));
    service = moduleRef.get(BankingService);
    onboarding = moduleRef.get(OnboardingService);
    auth = moduleRef.get(AuthService);
    await service.onModuleInit();
  });

  const bootstrapUser = async (userId: string, document: string) => {
    auth.register({
      document,
      password: 'SecretForte1!',
      displayName: 'Cliente Teste',
      email: `${userId}@test.com`,
      phone: '11999990000',
      birthDate: '1990-01-15',
      address: sampleAddress,
    });
    seedKycApproved(journeyStore, userId);
    const opened = await service.openCustomerAccount(userId);
    onboarding.markAccountActive(userId);
    return opened.accountId;
  };

  it('exige onboarding antes do dashboard', async () => {
    auth.register({
      document: '52998224725',
      password: 'SecretForte1!',
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
    channelBanking.mutate((draft) => {
      draft.welcomeCreditAccountsOpened = 30;
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
    const pending = await service.sendPix(
      '11144477735',
      '52998224725',
      50n,
      'pix-test-2',
    );
    expect(pending.status).toBe('PROCESSING');
    expect(pending.pollAfterMs).toBeGreaterThan(0);
    const result = await service.getPixTransfer(
      '11144477735',
      pending.paymentId,
    );
    expect(result.status).toBe('SETTLED');
    expect(BigInt(result.amountCents)).toBe(50n);
    const debtor = await service.getDashboard('11144477735');
    const creditor = await service.getDashboard('52998224725');
    expect(BigInt(debtor.balanceCents)).toBe(50n);
    expect(BigInt(creditor.balanceCents)).toBe(150n);
  });

  it('projeta Pix no extrato após liquidação', async () => {
    await bootstrapUser('11144477735', '11144477735');
    await bootstrapUser('52998224725', '52998224725');
    const pixPending = await service.sendPix(
      '11144477735',
      '52998224725',
      50n,
      'pix-test-extrato',
    );
    await service.getPixTransfer('11144477735', pixPending.paymentId);
    const items = await service.getTransactions('11144477735');
    const pixOut = items.find((item) => item.channel === 'pix' && item.type === 'outflow');
    expect(pixOut).toBeDefined();
    expect(BigInt(pixOut!.amountCents)).toBe(-50n);
  });

  it('rejeita titular alheio consultando pagamento Pix', async () => {
    await bootstrapUser('11144477735', '11144477735');
    await bootstrapUser('52998224725', '52998224725');
    await bootstrapUser('39053344705', '39053344705');
    const pending = await service.sendPix(
      '11144477735',
      '52998224725',
      50n,
      'pix-cross-account',
    );
    await expect(
      service.getPaymentStatus('39053344705', pending.paymentId),
    ).rejects.toThrow(ForbiddenException);
  });

  // §44/§48 — duplo clique: mesma Idempotency-Key + mesmo payload devolve o
  // MESMO paymentId e debita uma única vez (operação duplicada = reprovação).
  it('duplo clique no Pix não duplica débito (mesma chave, mesmo payload)', async () => {
    await bootstrapUser('11144477735', '11144477735');
    await bootstrapUser('52998224725', '52998224725');
    const first = await service.sendPix(
      '11144477735',
      '52998224725',
      50n,
      'pix-double-click',
    );
    const retry = await service.sendPix(
      '11144477735',
      '52998224725',
      50n,
      'pix-double-click',
    );
    expect(retry.paymentId).toBe(first.paymentId);
    expect(retry.endToEndId).toBe(first.endToEndId);
    await service.getPixTransfer('11144477735', first.paymentId);
    const debtor = await service.getDashboard('11144477735');
    expect(BigInt(debtor.balanceCents)).toBe(50n); // debitado UMA vez
  });

  // §44 — mesma Idempotency-Key com payload diferente é rejeitada pelo core
  // (IDEMPOTENCY_PAYLOAD_DRIFT), sem novo efeito financeiro.
  it('rejeita mesma idempotency key com payload diferente', async () => {
    await bootstrapUser('11144477735', '11144477735');
    await bootstrapUser('52998224725', '52998224725');
    await service.sendPix('11144477735', '52998224725', 50n, 'pix-drift-key');
    await expect(
      service.sendPix('11144477735', '52998224725', 25n, 'pix-drift-key'),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_PAYLOAD_DRIFT' });
    const debtor = await service.getDashboard('11144477735');
    // Apenas o primeiro Pix (50) pode ter saído do disponível; o drift não debita.
    expect(BigInt(debtor.availableCents)).toBeGreaterThanOrEqual(50n);
  });

  // §44 — comprovante de transação de outro titular não é acessível.
  it('rejeita comprovante de transação de outro titular', async () => {
    await bootstrapUser('11144477735', '11144477735');
    await bootstrapUser('52998224725', '52998224725');
    const pending = await service.sendPix(
      '11144477735',
      '52998224725',
      50n,
      'pix-receipt-cross',
    );
    await service.getPixTransfer('11144477735', pending.paymentId);
    const items = await service.getTransactions('11144477735');
    const pixOut = items.find(
      (item) => item.channel === 'pix' && item.type === 'outflow',
    );
    expect(pixOut).toBeDefined();
    // O extrato do credor não contém o lançamento de débito do pagador.
    await expect(
      service.getReceipt('52998224725', pixOut!.id),
    ).rejects.toThrow();
  });
});