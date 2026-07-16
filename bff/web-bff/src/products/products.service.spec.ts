import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CardsModule } from '@regenera/cards';
import { InvestmentsModule } from '@regenera/investments';
import { AuthService } from '../auth/auth.service';
import { BankingService } from '../banking/banking.service';
import { PaymentSettlementPublisher } from '../projections/payment-settlement.publisher';
import { CoreBankModule } from '../integrations/core-bank';
import { OnboardingService } from '../onboarding/onboarding.service';
import { ChannelJourneyService } from '@regenera/channel-persistence';
import {
  initTestPersistence,
  testPersistenceProviders,
} from '../persistence/test-persistence';
import { ProductsService } from './products.service';

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

describe('ProductsService (sandbox + ledger)', () => {
  let service: ProductsService;
  let banking: BankingService;
  let auth: AuthService;
  let onboarding: OnboardingService;
  let journeyStore: ChannelJourneyService;

  beforeEach(async () => {
    process.env.CORE_BANK_STORAGE = 'memory';
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        CoreBankModule.forRoot('memory'),
        CardsModule.register({ adapter: 'sandbox' }),
        InvestmentsModule.register({ adapter: 'sandbox' }),
      ],
      providers: [
        ...testPersistenceProviders,
        AuthService,
        PaymentSettlementPublisher,
        BankingService,
        ProductsService,
        {
          provide: OnboardingService,
          useFactory: onboardingStubFactory,
          inject: [ChannelJourneyService],
        },
      ],
    }).compile();
    ({ journey: journeyStore } = await initTestPersistence(moduleRef));
    banking = moduleRef.get(BankingService);
    auth = moduleRef.get(AuthService);
    onboarding = moduleRef.get(OnboardingService);
    service = moduleRef.get(ProductsService);
    await banking.onModuleInit();
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
    await banking.openCustomerAccount(userId);
    onboarding.markAccountActive(userId);
  };

  it('lista cartões sandbox para principal', async () => {
    const cards = await service.listCards('user-1');
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('captura cartão debita ledger (R$1 homolog → saldo menor)', async () => {
    const userId = '52998224725';
    await bootstrapUser(userId, userId);
    const before = await banking.getDashboard(userId);
    expect(BigInt(before.balanceCents)).toBe(100n);
    const issued = await service.issueCard(userId, 'Teste', '200000', 'issue-key-1');
    const authResult = await service.authorizePurchase(
      userId,
      issued.id,
      '50',
      'Loja Teste',
      'auth-key-1',
    );
    const tx = await service.capturePurchase(userId, issued.id, authResult.authId, 'cap-key-1');
    expect(tx.ledgerPaymentId).toBeDefined();
    const after = await banking.getDashboard(userId);
    expect(BigInt(after.balanceCents)).toBe(50n);
    expect(tx.balanceCents).toBe('50');
    const cardTx = after.recentTransactions.find((item) => item.channel === 'card');
    expect(cardTx?.type).toBe('outflow');
  });

  it('rewards vem do servidor com regra do programa (§17 — canal não calcula)', async () => {
    const userId = '52998224725';
    await bootstrapUser(userId, userId);
    // Boas-vindas homolog: R$1,00 inflow (1 lançamento) → 1 pt + 25 pts.
    const rewards = await service.getRewards(userId);
    expect(rewards.programVersion).toBe('regenera-rewards-v1');
    expect(rewards.tier).toBe('SEMENTE');
    expect(rewards.pointsBalance).toBe(26);
    expect(rewards.accruals).toHaveLength(2);
    expect(rewards.nextTierAt).toBe(500);
  });

  it('ordem de investimento debita ledger', async () => {
    const userId = '11144477735';
    await bootstrapUser(userId, userId);
    const order = await service.placeInvestmentOrder(userId, 'cdb-homolog', '50', 'order-key-1');
    expect(order.ledgerPaymentId).toBeDefined();
    expect(order.status).toBe('filled');
    const after = await banking.getDashboard(userId);
    expect(BigInt(after.balanceCents)).toBe(50n);
    const invTx = after.recentTransactions.find((item) => item.channel === 'investments');
    expect(invTx?.type).toBe('outflow');
  });
});