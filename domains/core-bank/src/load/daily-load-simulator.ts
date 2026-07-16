import { randomUUID } from 'crypto';
import { AccountClass } from '../accounts/account.entity';
import { CoreBankService } from '../core-bank.service';
import { PostingSide } from '../ledger/ledger.entity';
import { Money } from '../money/money.value-object';
import {
  DAILY_LOAD_TARGET,
  LOAD_SLO,
  LOAD_TEST_DEFAULT_OPS,
} from './canary-gate.config';
import { CanaryRouter } from './canary-router';

export interface LoadOperationResult {
  readonly idempotencyKey: string;
  readonly success: boolean;
  readonly latencyMs: number;
  readonly routedToCanary: boolean;
  readonly error?: string;
}

export interface DailyLoadMetrics {
  readonly operationsAttempted: number;
  readonly operationsSucceeded: number;
  readonly operationsFailed: number;
  readonly failureRate: number;
  readonly durationMs: number;
  readonly p95LatencyMs: number;
  readonly projectedDailyThroughput: number;
  readonly dailyTarget: number;
  readonly canaryRouted: number;
  readonly sloPassed: boolean;
}

export interface DailyLoadOptions {
  readonly operations?: number;
  readonly dailyTarget?: number;
  readonly amountCents?: bigint;
}

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index]!;
};

export async function seedLoadAccounts(
  core: CoreBankService,
  initialCents = 500_000_000n,
): Promise<{ customerId: string; clearingId: string }> {
  const customer = await core.accounts.open({ accountClass: AccountClass.LIABILITY });
  const clearing = await core.accounts.open({ accountClass: AccountClass.LIABILITY });
  const cash = await core.accounts.open({ accountClass: AccountClass.ASSET });
  await core.ledger.post({
    correlationId: randomUUID(),
    postings: [
      {
        ledgerAccountId: cash.id,
        accountClass: AccountClass.ASSET,
        side: PostingSide.DEBIT,
        amount: Money.fromCents(initialCents),
      },
      {
        ledgerAccountId: customer.id,
        accountClass: AccountClass.LIABILITY,
        side: PostingSide.CREDIT,
        amount: Money.fromCents(initialCents),
      },
    ],
  });
  return { customerId: customer.id, clearingId: clearing.id };
}

export async function runDailyLoad(
  core: CoreBankService,
  options: DailyLoadOptions = {},
): Promise<{ metrics: DailyLoadMetrics; results: LoadOperationResult[] }> {
  const operations =
    options.operations ??
    Number(process.env.LOAD_TEST_OPS ?? LOAD_TEST_DEFAULT_OPS);
  const dailyTarget = options.dailyTarget ?? DAILY_LOAD_TARGET;
  const amountCents = options.amountCents ?? 100n;
  const correlationId = randomUUID();
  const router = new CanaryRouter();

  const { customerId, clearingId } = await seedLoadAccounts(core);
  const startedAt = Date.now();
  const results: LoadOperationResult[] = [];

  for (let i = 0; i < operations; i += 1) {
    const idempotencyKey = `load-${correlationId}-${i}`;
    const canary = router.decide(idempotencyKey);
    const opStarted = Date.now();
    try {
      await core.payments.create({
        debtorAccountId: customerId,
        creditorAccountId: clearingId,
        amount: Money.fromCents(amountCents),
        idempotencyKey,
        correlationId,
      });
      results.push({
        idempotencyKey,
        success: true,
        latencyMs: Date.now() - opStarted,
        routedToCanary: canary.routeToCanary,
      });
    } catch (error) {
      results.push({
        idempotencyKey,
        success: false,
        latencyMs: Date.now() - opStarted,
        routedToCanary: canary.routeToCanary,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const durationMs = Date.now() - startedAt;
  const latencies = results.map((r) => r.latencyMs);
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.length - succeeded;
  const failureRate = results.length === 0 ? 0 : failed / results.length;
  const projectedDailyThroughput =
    durationMs === 0
      ? dailyTarget
      : Math.floor((results.length * 86_400_000) / durationMs);
  const p95LatencyMs = percentile(latencies, 95);
  const sloPassed =
    failureRate <= LOAD_SLO.maxFailureRate &&
    p95LatencyMs <= LOAD_SLO.maxP95LatencyMs &&
    projectedDailyThroughput >= dailyTarget;

  return {
    metrics: {
      operationsAttempted: results.length,
      operationsSucceeded: succeeded,
      operationsFailed: failed,
      failureRate,
      durationMs,
      p95LatencyMs,
      projectedDailyThroughput,
      dailyTarget,
      canaryRouted: results.filter((r) => r.routedToCanary).length,
      sloPassed,
    },
    results,
  };
}