import { randomUUID } from 'crypto';
import { AccountClass, LedgerAccount } from '../accounts/account.entity';
import { InMemoryAccountRepository } from '../accounts/in-memory-account.repository';
import { AuditChainService } from '../audit/audit-chain.service';
import { InMemoryAuditChainRepository } from '../audit/in-memory-audit-chain.repository';
import { HoldBookService } from '../holds/hold-book.service';
import { InMemoryHoldRepository } from '../holds/in-memory-hold.repository';
import { LedgerSignedBalanceProvider } from '../holds/ledger-signed-balance.provider';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { IdempotencyState } from '../idempotency/idempotency.entity';
import { InMemoryIdempotencyRepository } from '../idempotency/in-memory-idempotency.repository';
import { LedgerService } from '../ledger/ledger.service';
import { InMemoryLedgerRepository } from '../ledger/in-memory-ledger.repository';
import { PostingSide } from '../ledger/ledger.entity';
import { Money } from '../money/money.value-object';
import { OutboxService } from '../outbox/outbox.service';
import { OutboxEventRecord } from '../outbox/outbox.entity';
import { OutboxRepository } from '../outbox/outbox.repository';
import { InMemoryOutboxRepository } from '../outbox/in-memory-outbox.repository';
import {
  ConflictException,
  StateTransitionException,
  ValidationException,
} from '../errors/core-banking.errors';
import { ReconciliationService } from '../reconciliation/reconciliation.service';
import { InMemoryReconciliationRepository } from '../reconciliation/in-memory-reconciliation.repository';
import { PaymentEngineService } from './payment-engine.service';
import { InMemoryPaymentRepository } from './in-memory-payment.repository';
import { PaymentStatus } from './payment.entity';
import { ReconciliationResolution } from '../reconciliation/reconciliation.entity';

class FailingOutboxRepository implements OutboxRepository {
  async append(_event: OutboxEventRecord): Promise<OutboxEventRecord> {
    throw new Error('outbox indisponível');
  }

  async findById(): Promise<OutboxEventRecord | null> {
    return null;
  }

  async findPending(): Promise<OutboxEventRecord[]> {
    return [];
  }

  async updatePublishedAt(): Promise<OutboxEventRecord> {
    throw new Error('outbox indisponível');
  }
}

describe('PaymentEngineService (PR-10)', () => {
  const CORRELATION = randomUUID();
  let customerId: string;
  let clearingId: string;
  let cashId: string;

  let accounts: InMemoryAccountRepository;
  let payments: InMemoryPaymentRepository;
  let ledgerRepo: InMemoryLedgerRepository;
  let ledger: LedgerService;
  let holds: HoldBookService;
  let idempotency: IdempotencyService;
  let idempotencyRepo: InMemoryIdempotencyRepository;
  let outbox: OutboxService;
  let audit: AuditChainService;
  let engine: PaymentEngineService;

  const buildEngine = (outboxRepo: OutboxRepository = new InMemoryOutboxRepository()) => {
    accounts = new InMemoryAccountRepository();
    payments = new InMemoryPaymentRepository();
    ledgerRepo = new InMemoryLedgerRepository();
    ledger = new LedgerService(ledgerRepo);
    const holdRepo = new InMemoryHoldRepository();
    const balances = new LedgerSignedBalanceProvider(ledger, accounts);
    holds = new HoldBookService(holdRepo, balances);
    idempotencyRepo = new InMemoryIdempotencyRepository();
    idempotency = new IdempotencyService(idempotencyRepo);
    outbox = new OutboxService(outboxRepo);
    audit = new AuditChainService(new InMemoryAuditChainRepository());
    const reconciliation = new ReconciliationService(
      new InMemoryReconciliationRepository(),
      payments,
      holds,
      ledger,
    );
    engine = new PaymentEngineService(
      payments,
      accounts,
      idempotency,
      holds,
      ledger,
      outbox,
      audit,
      reconciliation,
    );
  };

  const openAccounts = async (initialCents = 10_000) => {
    customerId = randomUUID();
    clearingId = randomUUID();
    cashId = randomUUID();

    await accounts.save(
      LedgerAccount.open({
        id: customerId,
        accountClass: AccountClass.LIABILITY,
      }),
    );
    await accounts.save(
      LedgerAccount.open({
        id: clearingId,
        accountClass: AccountClass.LIABILITY,
      }),
    );
    await accounts.save(
      LedgerAccount.open({
        id: cashId,
        accountClass: AccountClass.ASSET,
      }),
    );

    await ledger.post({
      correlationId: randomUUID(),
      postings: [
        {
          ledgerAccountId: cashId,
          accountClass: AccountClass.ASSET,
          side: PostingSide.DEBIT,
          amount: Money.fromCents(initialCents),
        },
        {
          ledgerAccountId: customerId,
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: Money.fromCents(initialCents),
        },
      ],
    });
  };

  const createPayment = async (
    amountCents: number,
    key = `pay-${randomUUID()}`,
  ) => {
    const payment = await engine.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(amountCents),
      idempotencyKey: key,
      correlationId: CORRELATION,
    });
    await engine.markSent(payment.id);
    return payment;
  };

  beforeEach(async () => {
    buildEngine();
    await openAccounts();
  });

  it('create reserva hold e emite outbox PaymentCreated', async () => {
    const payment = await engine.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(2_000),
      idempotencyKey: 'idem-create-1',
      correlationId: CORRELATION,
    });
    expect(payment.status).toBe(PaymentStatus.CREATED);
    expect(payment.holdId).not.toBeNull();
    const available = await holds.availableBalance(customerId);
    expect(available.equals(Money.fromCents(8_000))).toBe(true);
    const pending = await outbox.pending(10);
    expect(pending.some((e) => e.eventType === 'PaymentCreated')).toBe(true);
  });

  it('fundos insuficientes → ConflictException', async () => {
    await expect(
      engine.create({
        debtorAccountId: customerId,
        creditorAccountId: clearingId,
        amount: Money.fromCents(10_001),
        idempotencyKey: 'idem-insufficient',
        correlationId: CORRELATION,
      }),
    ).rejects.toMatchObject({ code: 'PAYMENT_INSUFFICIENT_FUNDS' });
    await expect(
      engine.create({
        debtorAccountId: customerId,
        creditorAccountId: clearingId,
        amount: Money.fromCents(10_001),
        idempotencyKey: 'idem-insufficient',
        correlationId: CORRELATION,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('conta ASSET como clearing → ValidationException', async () => {
    const assetCreditor = randomUUID();
    await accounts.save(
      LedgerAccount.open({
        id: assetCreditor,
        accountClass: AccountClass.ASSET,
      }),
    );
    await expect(
      engine.create({
        debtorAccountId: customerId,
        creditorAccountId: assetCreditor,
        amount: Money.fromCents(1_000),
        idempotencyKey: 'idem-asset-clearing',
        correlationId: CORRELATION,
      }),
    ).rejects.toMatchObject({ code: 'PAYMENT_ASSET_CLEARING_FORBIDDEN' });
    await expect(
      engine.create({
        debtorAccountId: customerId,
        creditorAccountId: assetCreditor,
        amount: Money.fromCents(1_000),
        idempotencyKey: 'idem-asset-clearing',
        correlationId: CORRELATION,
      }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('16 threads simultâneas com mesma chave → 1 efeito financeiro', async () => {
    const key = 'idem-concurrent-16';
    const attempts = await Promise.allSettled(
      Array.from({ length: 16 }, () =>
        engine.create({
          debtorAccountId: customerId,
          creditorAccountId: clearingId,
          amount: Money.fromCents(1_000),
          idempotencyKey: key,
          correlationId: CORRELATION,
        }),
      ),
    );
    const fulfilled = attempts.filter((r) => r.status === 'fulfilled');
    expect(fulfilled.length).toBeGreaterThan(0);
    expect(payments.countPayments()).toBe(1);
    const byKey = await payments.findByIdempotencyKey(key);
    expect(byKey).not.toBeNull();
  });

  it('UNKNOWN bloqueia retry automático → StateTransitionException', async () => {
    const payment = await createPayment(1_500, 'idem-unknown-retry');
    await engine.markUnknown(payment.id);
    await expect(
      engine.create({
        debtorAccountId: customerId,
        creditorAccountId: clearingId,
        amount: Money.fromCents(1_500),
        idempotencyKey: 'idem-unknown-retry',
        correlationId: CORRELATION,
      }),
    ).rejects.toMatchObject({ code: 'PAYMENT_UNKNOWN_BLOCKS_RETRY' });
  });

  it('ensureSettled é idempotente em replay de idempotency-key', async () => {
    const payment = await createPayment(2_500, 'idem-ensure-settled');
    const first = await engine.ensureSettled(payment.id);
    const second = await engine.ensureSettled(payment.id);
    expect(first.status).toBe(PaymentStatus.SETTLED);
    expect(second.status).toBe(PaymentStatus.SETTLED);
    expect(second.id).toBe(first.id);
  });

  it('markSettled posta ledger e consome hold', async () => {
    const payment = await createPayment(3_000, 'idem-settle');
    const settled = await engine.markSettled(payment.id);
    expect(settled.status).toBe(PaymentStatus.SETTLED);
    expect(settled.journalEntryId).not.toBeNull();
    const balance = await ledger.signedBalance(customerId, AccountClass.LIABILITY);
    expect(balance.equals(Money.fromCents(7_000))).toBe(true);
    expect((await holds.availableBalance(customerId)).equals(Money.fromCents(7_000))).toBe(
      true,
    );
  });

  it('markUnknown mantém hold ativo', async () => {
    const payment = await createPayment(2_200, 'idem-unknown-hold');
    await engine.markUnknown(payment.id);
    expect((await holds.availableBalance(customerId)).equals(Money.fromCents(7_800))).toBe(
      true,
    );
  });

  it('reconciliação SETTLED mantém saldo debitado', async () => {
    const payment = await createPayment(4_000, 'idem-recon-settled');
    await engine.markUnknown(payment.id);
    await engine.openReconciliation(payment.id, 'maker-1', 'evidence-settled');
    const reconciled = await engine.reconcile({
      paymentId: payment.id,
      resolution: ReconciliationResolution.SETTLED,
      evidenceRef: 'evidence-settled',
      makerId: 'maker-1',
      checkerId: 'checker-1',
    });
    expect(reconciled.status).toBe(PaymentStatus.RECONCILED);
    const balance = await ledger.signedBalance(customerId, AccountClass.LIABILITY);
    expect(balance.equals(Money.fromCents(6_000))).toBe(true);
  });

  it('reconciliação REJECTED restaura saldo disponível', async () => {
    const payment = await createPayment(2_500, 'idem-recon-rejected');
    await engine.markUnknown(payment.id);
    await engine.openReconciliation(payment.id, 'maker-2', 'evidence-rejected');
    await engine.reconcile({
      paymentId: payment.id,
      resolution: ReconciliationResolution.REJECTED,
      evidenceRef: 'evidence-rejected',
      makerId: 'maker-2',
      checkerId: 'checker-2',
    });
    expect((await holds.availableBalance(customerId)).equals(Money.fromCents(10_000))).toBe(
      true,
    );
    const balance = await ledger.signedBalance(customerId, AccountClass.LIABILITY);
    expect(balance.equals(Money.fromCents(10_000))).toBe(true);
  });

  it('falha no create deixa idempotência em FAILED_FINAL, não PROCESSING', async () => {
    buildEngine(new FailingOutboxRepository());
    await openAccounts();
    const key = 'idem-fail-final';
    await expect(
      engine.create({
        debtorAccountId: customerId,
        creditorAccountId: clearingId,
        amount: Money.fromCents(500),
        idempotencyKey: key,
        correlationId: CORRELATION,
      }),
    ).rejects.toThrow('outbox indisponível');
    const record = await idempotencyRepo.findByKey(key);
    expect(record?.state).toBe(IdempotencyState.FAILED_FINAL);
    expect(payments.countPayments()).toBe(0);
  });

  it('mesmo idempotencyKey após COMPLETED → replay do pagamento original', async () => {
    const key = 'idem-replay';
    const first = await engine.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(1_200),
      idempotencyKey: key,
      correlationId: CORRELATION,
    });
    const second = await engine.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(1_200),
      idempotencyKey: key,
      correlationId: CORRELATION,
    });
    expect(second.id).toBe(first.id);
    expect(payments.countPayments()).toBe(1);
  });

  it('markSent transiciona CREATED → SENT', async () => {
    const payment = await engine.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(900),
      idempotencyKey: 'idem-sent',
      correlationId: CORRELATION,
    });
    const sent = await engine.markSent(payment.id);
    expect(sent.status).toBe(PaymentStatus.SENT);
  });

  it('transição inválida SETTLED → SENT → StateTransitionException', async () => {
    const payment = await createPayment(1_000, 'idem-invalid-transition');
    await engine.markSettled(payment.id);
    await expect(engine.markSent(payment.id)).rejects.toMatchObject({
      code: 'PAYMENT_INVALID_TRANSITION',
    });
  });

  it('create registra evento na Audit chain', async () => {
    await engine.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(600),
      idempotencyKey: 'idem-Audit',
      correlationId: CORRELATION,
    });
    const verification = await audit.verify();
    expect(verification.valid).toBe(true);
    expect(verification.eventsChecked).toBeGreaterThan(0);
  });

  it('openReconciliation exige pagamento UNKNOWN', async () => {
    const payment = await engine.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(700),
      idempotencyKey: 'idem-open-recon',
      correlationId: CORRELATION,
    });
    await expect(
      engine.openReconciliation(payment.id, 'maker-x', 'evidence'),
    ).rejects.toMatchObject({ code: 'RECONCILIATION_NOT_UNKNOWN' });
    await engine.markSent(payment.id);
    await engine.markUnknown(payment.id);
    const openCase = await engine.openReconciliation(
      payment.id,
      'maker-x',
      'evidence',
    );
    expect(openCase.status).toBe('OPEN');
  });
});