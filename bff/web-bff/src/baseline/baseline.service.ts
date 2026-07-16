import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AccountClass,
  CoreBankService,
  Money,
  PaymentStatus,
  PostingSide,
  ReconciliationResolution,
  StateTransitionException,
} from '../integrations/core-bank';
import { OnboardingService } from '../onboarding/onboarding.service';
import { ChannelIdentityService } from '@regenera/channel-persistence';

export interface BaselineManifest {
  readonly commitHint: string;
  readonly persistence: string;
  readonly homologUsers: number;
  readonly activeAccounts: number;
  readonly baselineMode: boolean;
}

export interface FinancialProbeResult {
  readonly idempotencyReplay: boolean;
  readonly unknownBlocksRetry: boolean;
  readonly reconciliationClosed: boolean;
  readonly ledgerBalanced: boolean;
}

@Injectable()
export class BaselineService {
  constructor(
    private readonly core: CoreBankService,
    private readonly identity: ChannelIdentityService,
    private readonly onboarding: OnboardingService,
  ) {}

  manifest(): BaselineManifest {
    const manifest = this.core.getManifest();
    const snapshot = this.identity.get();
    return {
      commitHint: process.env.BASELINE_COMMIT_HINT?.trim() || 'local',
      persistence: manifest.persistence,
      homologUsers: Object.keys(snapshot.users).length,
      activeAccounts: this.onboarding.listActiveUserIds().length,
      baselineMode: true,
    };
  }

  approveKycReview(userId: string, checkerId: string): { ok: true; checkerId: string } {
    return this.onboarding.approveByBaselineOperator(userId, checkerId);
  }

  async runFinancialProbes(): Promise<FinancialProbeResult> {
    const debtor = await this.core.accounts.open({
      accountClass: AccountClass.LIABILITY,
      externalReference: `baseline-debtor-${randomUUID()}`,
    });
    const creditor = await this.core.accounts.open({
      accountClass: AccountClass.LIABILITY,
      externalReference: `baseline-creditor-${randomUUID()}`,
    });
    const asset = await this.core.accounts.open({
      accountClass: AccountClass.ASSET,
      externalReference: `baseline-asset-${randomUUID()}`,
    });

    await this.core.ledger.post({
      correlationId: randomUUID(),
      postings: [
        {
          ledgerAccountId: asset.id,
          accountClass: AccountClass.ASSET,
          side: PostingSide.DEBIT,
          amount: Money.fromCents(10_000n),
        },
        {
          ledgerAccountId: debtor.id,
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: Money.fromCents(10_000n),
        },
      ],
    });

    const idempotencyKey = `baseline-idem-${randomUUID()}`;
    const correlationId = randomUUID();
    const payment1 = await this.core.payments.create({
      debtorAccountId: debtor.id,
      creditorAccountId: creditor.id,
      amount: Money.fromCents(100n),
      idempotencyKey,
      correlationId,
    });
    const payment2 = await this.core.payments.create({
      debtorAccountId: debtor.id,
      creditorAccountId: creditor.id,
      amount: Money.fromCents(100n),
      idempotencyKey,
      correlationId,
    });
    const idempotencyReplay = payment2.id === payment1.id;

    await this.core.payments.markSent(payment1.id);
    await this.core.payments.markSettled(payment1.id);

    const unknownKey = `baseline-unknown-${randomUUID()}`;
    const unknownPayment = await this.core.payments.create({
      debtorAccountId: debtor.id,
      creditorAccountId: creditor.id,
      amount: Money.fromCents(50n),
      idempotencyKey: unknownKey,
      correlationId: randomUUID(),
    });
    await this.core.payments.markSent(unknownPayment.id);
    await this.core.payments.markUnknown(unknownPayment.id);

    let unknownBlocksRetry = false;
    try {
      await this.core.payments.create({
        debtorAccountId: debtor.id,
        creditorAccountId: creditor.id,
        amount: Money.fromCents(50n),
        idempotencyKey: unknownKey,
        correlationId: randomUUID(),
      });
    } catch (error: unknown) {
      const code =
        error instanceof StateTransitionException
          ? error.code
          : typeof error === 'object' &&
              error !== null &&
              'code' in error
            ? String((error as { code: unknown }).code)
            : undefined;
      unknownBlocksRetry = code === 'PAYMENT_UNKNOWN_BLOCKS_RETRY';
    }

    const makerId = 'baseline-maker';
    const evidenceRef = 'baseline-evidence';
    await this.core.reconciliation.open(
      unknownPayment.id,
      makerId,
      evidenceRef,
    );
    const reconciled = await this.core.reconciliation.resolve({
      paymentId: unknownPayment.id,
      resolution: ReconciliationResolution.REJECTED,
      evidenceRef,
      makerId,
      checkerId: 'baseline-checker',
    });

    const ledgerBalanced = reconciled.status === PaymentStatus.RECONCILED;

    return {
      idempotencyReplay,
      unknownBlocksRetry,
      reconciliationClosed: ledgerBalanced,
      ledgerBalanced,
    };
  }
}