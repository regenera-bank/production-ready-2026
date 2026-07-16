import { randomUUID } from 'crypto';
import { AccountClass, LedgerAccount } from '../accounts/account.entity';
import { InMemoryAccountRepository } from '../accounts/in-memory-account.repository';
import { AuditChainService } from '../audit/audit-chain.service';
import { InMemoryAuditChainRepository } from '../audit/in-memory-audit-chain.repository';
import { HoldBookService } from '../holds/hold-book.service';
import { InMemoryHoldRepository } from '../holds/in-memory-hold.repository';
import { LedgerSignedBalanceProvider } from '../holds/ledger-signed-balance.provider';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { InMemoryIdempotencyRepository } from '../idempotency/in-memory-idempotency.repository';
import { LedgerService } from '../ledger/ledger.service';
import { InMemoryLedgerRepository } from '../ledger/in-memory-ledger.repository';
import { PostingSide } from '../ledger/ledger.entity';
import { Money } from '../money/money.value-object';
import { OutboxService } from '../outbox/outbox.service';
import { InMemoryOutboxRepository } from '../outbox/in-memory-outbox.repository';
import { PaymentEngineService } from '../payments/payment-engine.service';
import { InMemoryPaymentRepository } from '../payments/in-memory-payment.repository';
import { PaymentStatus } from '../payments/payment.entity';
import {
  ConflictException,
  NotFoundException,
  StateTransitionException,
  ValidationException,
} from '../errors/core-banking.errors';
import { ReconciliationService } from './reconciliation.service';
import { InMemoryReconciliationRepository } from './in-memory-reconciliation.repository';
import {
  ReconciliationCaseStatus,
  ReconciliationResolution,
} from './reconciliation.entity';

describe('ReconciliationService (PR-12)', () => {
  const CORRELATION = randomUUID();
  let customerId: string;
  let clearingId: string;
  let cashId: string;

  let payments: InMemoryPaymentRepository;
  let cases: InMemoryReconciliationRepository;
  let holds: HoldBookService;
  let ledger: LedgerService;
  let paymentEngine: PaymentEngineService;
  let service: ReconciliationService;

  const setup = () => {
    const accounts = new InMemoryAccountRepository();
    payments = new InMemoryPaymentRepository();
    cases = new InMemoryReconciliationRepository();
    const ledgerRepo = new InMemoryLedgerRepository();
    ledger = new LedgerService(ledgerRepo);
    holds = new HoldBookService(
      new InMemoryHoldRepository(),
      new LedgerSignedBalanceProvider(ledger, accounts),
    );
    service = new ReconciliationService(cases, payments, holds, ledger);
    paymentEngine = new PaymentEngineService(
      payments,
      accounts,
      new IdempotencyService(new InMemoryIdempotencyRepository()),
      holds,
      ledger,
      new OutboxService(new InMemoryOutboxRepository()),
      new AuditChainService(new InMemoryAuditChainRepository()),
      service,
    );
    return accounts;
  };

  const seed = async (accounts: InMemoryAccountRepository, initial = 10_000) => {
    customerId = randomUUID();
    clearingId = randomUUID();
    cashId = randomUUID();
    await accounts.save(
      LedgerAccount.open({ id: customerId, accountClass: AccountClass.LIABILITY }),
    );
    await accounts.save(
      LedgerAccount.open({ id: clearingId, accountClass: AccountClass.LIABILITY }),
    );
    await accounts.save(
      LedgerAccount.open({ id: cashId, accountClass: AccountClass.ASSET }),
    );
    await ledger.post({
      correlationId: randomUUID(),
      postings: [
        {
          ledgerAccountId: cashId,
          accountClass: AccountClass.ASSET,
          side: PostingSide.DEBIT,
          amount: Money.fromCents(initial),
        },
        {
          ledgerAccountId: customerId,
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: Money.fromCents(initial),
        },
      ],
    });
  };

  const unknownPayment = async (amountCents: number, key: string) => {
    const payment = await paymentEngine.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(amountCents),
      idempotencyKey: key,
      correlationId: CORRELATION,
    });
    await paymentEngine.markSent(payment.id);
    await paymentEngine.markUnknown(payment.id);
    return payment;
  };

  beforeEach(async () => {
    const accounts = setup();
    await seed(accounts);
  });

  it('open só aceita pagamento UNKNOWN', async () => {
    const payment = await paymentEngine.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(1_000),
      idempotencyKey: 'recon-open-created',
      correlationId: CORRELATION,
    });
    await expect(
      service.open(payment.id, 'maker-1', 'evidence'),
    ).rejects.toMatchObject({ code: 'RECONCILIATION_NOT_UNKNOWN' });

    await paymentEngine.markSent(payment.id);
    await paymentEngine.markUnknown(payment.id);
    const openCase = await service.open(payment.id, 'maker-1', 'evidence');
    expect(openCase.status).toBe(ReconciliationCaseStatus.OPEN);
  });

  it('segundo open no mesmo pagamento → ConflictException', async () => {
    const payment = await unknownPayment(2_000, 'recon-dup-open');
    await service.open(payment.id, 'maker-1', 'evidence-1');
    await expect(
      service.open(payment.id, 'maker-2', 'evidence-2'),
    ).rejects.toMatchObject({ code: 'RECONCILIATION_ALREADY_OPEN' });
    await expect(
      service.open(payment.id, 'maker-2', 'evidence-2'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maker-checker: checker igual ao maker → ValidationException', async () => {
    const payment = await unknownPayment(1_500, 'recon-maker-checker');
    await service.open(payment.id, 'maker-1', 'evidence');
    await expect(
      service.resolve({
        paymentId: payment.id,
        resolution: ReconciliationResolution.REJECTED,
        evidenceRef: 'evidence',
        makerId: 'maker-1',
        checkerId: 'maker-1',
      }),
    ).rejects.toMatchObject({ code: 'RECONCILIATION_MAKER_CHECKER' });
    await expect(
      service.resolve({
        paymentId: payment.id,
        resolution: ReconciliationResolution.REJECTED,
        evidenceRef: 'evidence',
        makerId: 'maker-1',
        checkerId: 'maker-1',
      }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('resolve SETTLED debita saldo e fecha caso', async () => {
    const payment = await unknownPayment(3_000, 'recon-settled');
    await service.open(payment.id, 'maker-1', 'evidence-settled');
    const reconciled = await service.resolve({
      paymentId: payment.id,
      resolution: ReconciliationResolution.SETTLED,
      evidenceRef: 'evidence-settled',
      makerId: 'maker-1',
      checkerId: 'checker-1',
    });
    expect(reconciled.status).toBe(PaymentStatus.RECONCILED);
    const balance = await ledger.signedBalance(customerId, AccountClass.LIABILITY);
    expect(balance.equals(Money.fromCents(7_000))).toBe(true);
    const closed = await cases.findOpenByPayment(payment.id);
    expect(closed).toBeNull();
  });

  it('resolve REJECTED restaura saldo disponível', async () => {
    const payment = await unknownPayment(2_500, 'recon-rejected');
    await service.open(payment.id, 'maker-2', 'evidence-rejected');
    await service.resolve({
      paymentId: payment.id,
      resolution: ReconciliationResolution.REJECTED,
      evidenceRef: 'evidence-rejected',
      makerId: 'maker-2',
      checkerId: 'checker-2',
    });
    expect((await holds.availableBalance(customerId)).equals(Money.fromCents(10_000))).toBe(
      true,
    );
  });

  it('resolve sem caso aberto → NotFoundException', async () => {
    const payment = await unknownPayment(800, 'recon-no-case');
    await expect(
      service.resolve({
        paymentId: payment.id,
        resolution: ReconciliationResolution.SETTLED,
        evidenceRef: 'x',
        makerId: 'm',
        checkerId: 'c',
      }),
    ).rejects.toMatchObject({ code: 'RECONCILIATION_CASE_NOT_FOUND' });
    await expect(
      service.resolve({
        paymentId: payment.id,
        resolution: ReconciliationResolution.SETTLED,
        evidenceRef: 'x',
        makerId: 'm',
        checkerId: 'c',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resolve em pagamento CREATED → StateTransitionException', async () => {
    const payment = await paymentEngine.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(500),
      idempotencyKey: 'recon-not-unknown',
      correlationId: CORRELATION,
    });
    await expect(
      service.resolve({
        paymentId: payment.id,
        resolution: ReconciliationResolution.REJECTED,
        evidenceRef: 'x',
        makerId: 'm',
        checkerId: 'c',
      }),
    ).rejects.toMatchObject({ code: 'RECONCILIATION_NOT_UNKNOWN' });
    await expect(
      service.resolve({
        paymentId: payment.id,
        resolution: ReconciliationResolution.REJECTED,
        evidenceRef: 'x',
        makerId: 'm',
        checkerId: 'c',
      }),
    ).rejects.toBeInstanceOf(StateTransitionException);
  });

  it('caso resolvido fica com status SETTLED ou REJECTED', async () => {
    const payment = await unknownPayment(1_200, 'recon-case-status');
    const openCase = await service.open(payment.id, 'maker-3', 'evidence');
    await service.resolve({
      paymentId: payment.id,
      resolution: ReconciliationResolution.SETTLED,
      evidenceRef: 'evidence',
      makerId: 'maker-3',
      checkerId: 'checker-3',
    });
    const resolved = await cases.findById(openCase.id);
    expect(resolved?.status).toBe(ReconciliationCaseStatus.SETTLED);
    expect(resolved?.checkerId).toBe('checker-3');
    expect(resolved?.resolvedAt).not.toBeNull();
  });
});