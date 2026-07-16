import { Test, TestingModule } from '@nestjs/testing';
import { CoreBankModule } from '../integrations/core-bank';
import {
  initTestPersistence,
  testPersistenceProviders,
} from '../persistence/test-persistence';
import { OnboardingService } from '../onboarding/onboarding.service';
import { BaselineService } from './baseline.service';

describe('BaselineService (financial probes)', () => {
  let service: BaselineService;

  beforeEach(async () => {
    process.env.CORE_BANK_STORAGE = 'memory';
    delete process.env.DATABASE_URL;

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CoreBankModule.forRoot('memory')],
      providers: [
        ...testPersistenceProviders,
        BaselineService,
        {
          provide: OnboardingService,
          useValue: { listActiveUserIds: () => [] },
        },
      ],
    }).compile();

    await initTestPersistence(moduleRef);
    service = moduleRef.get(BaselineService);
  });

  it('idempotência, UNKNOWN e reconciliação fecham caso', async () => {
    const result = await service.runFinancialProbes();
    expect(result.idempotencyReplay).toBe(true);
    expect(result.unknownBlocksRetry).toBe(true);
    expect(result.reconciliationClosed).toBe(true);
    expect(result.ledgerBalanced).toBe(true);
  });
});