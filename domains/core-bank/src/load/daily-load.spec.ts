import { Test, TestingModule } from '@nestjs/testing';
import { CoreBankModule } from '../core-bank.module';
import { CoreBankService } from '../core-bank.service';
import { InMemoryPaymentRepository } from '../payments/in-memory-payment.repository';
import { DAILY_LOAD_TARGET, LOAD_SLO } from './canary-gate.config';
import { runDailyLoad } from './daily-load-simulator';

describe('Daily load 50k/dia (PR-15)', () => {
  let moduleRef: TestingModule;
  let core: CoreBankService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CoreBankModule],
    }).compile();
    core = moduleRef.get(CoreBankService);
  });

  it('amostra CI atinge SLO e projeta ≥ 50k/dia', async () => {
    const { metrics } = await runDailyLoad(core, { operations: 500 });
    expect(metrics.operationsAttempted).toBe(500);
    expect(metrics.operationsSucceeded).toBe(500);
    expect(metrics.failureRate).toBeLessThanOrEqual(LOAD_SLO.maxFailureRate);
    expect(metrics.p95LatencyMs).toBeLessThanOrEqual(LOAD_SLO.maxP95LatencyMs);
    expect(metrics.projectedDailyThroughput).toBeGreaterThanOrEqual(DAILY_LOAD_TARGET);
    expect(metrics.dailyTarget).toBe(DAILY_LOAD_TARGET);
    expect(metrics.sloPassed).toBe(true);
  });

  it('cria exatamente 1 pagamento por chave idempotente', async () => {
    const paymentRepo = moduleRef.get(InMemoryPaymentRepository);
    const countBefore = paymentRepo.countPayments();
    const { metrics } = await runDailyLoad(core, { operations: 200 });
    expect(metrics.operationsSucceeded).toBe(200);
    expect(paymentRepo.countPayments()).toBe(countBefore + 200);
  });

  const fullLoadOps = Number(process.env.LOAD_TEST_OPS ?? 0);
  (fullLoadOps >= DAILY_LOAD_TARGET ? it : it.skip)(
    'carga nominal 50k operações (LOAD_TEST_OPS=50000)',
    async () => {
      const { metrics } = await runDailyLoad(core, { operations: fullLoadOps });
      expect(metrics.operationsSucceeded).toBe(fullLoadOps);
      expect(metrics.sloPassed).toBe(true);
    },
    300_000,
  );
});