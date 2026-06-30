import { readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AccountClass, AccountStatus, LedgerAccount } from '../accounts/account.entity';
import { InMemoryAccountRepository } from '../accounts/in-memory-account.repository';
import { AuditChainService } from '../audit/audit-chain.service';
import { InMemoryAuditChainRepository } from '../audit/in-memory-audit-chain.repository';
import { CoreBankModule, PIX_HMAC_SECRET } from '../core-bank.module';
import { CoreBankService } from '../core-bank.service';
import {
  ConflictException,
  StateTransitionException,
  ValidationException,
} from '../errors/core-banking.errors';
import { IdempotencyState } from '../idempotency/idempotency.entity';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { InMemoryIdempotencyRepository } from '../idempotency/in-memory-idempotency.repository';
import { PostingSide } from '../ledger/ledger.entity';
import { Money, MoneyError } from '../money/money.value-object';
import { OutboxEventRecord } from '../outbox/outbox.entity';
import { OutboxRepository } from '../outbox/outbox.repository';
import { OutboxService } from '../outbox/outbox.service';
import { PaymentEngineService } from '../payments/payment-engine.service';
import { InMemoryPaymentRepository } from '../payments/in-memory-payment.repository';
import { PaymentRecord, PaymentStatus } from '../payments/payment.entity';
import { PixEngineService } from '../pix/pix-engine.service';
import { PixKeyType, HOMOLOG_ISPB } from '../pix/pix.entity';
import { ReconciliationResolution } from '../reconciliation/reconciliation.entity';
import { ReconciliationService } from '../reconciliation/reconciliation.service';
import { InMemoryReconciliationRepository } from '../reconciliation/in-memory-reconciliation.repository';
import { CORE_BANKING_INVARIANT_COUNT } from './invariant-registry';

const V001 = readFileSync(
  join(__dirname, '../../db/migrations/V001__core_banking_foundation.sql'),
  'utf8',
);
const V002 = readFileSync(
  join(__dirname, '../../db/migrations/V002__operational_views.sql'),
  'utf8',
);

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

describe(`Core Banking — ${CORE_BANKING_INVARIANT_COUNT} invariantes (PR-14)`, () => {
  let moduleRef: TestingModule;
  let core: CoreBankService;
  let customerId: string;
  let clearingId: string;
  let cashId: string;
  const correlationId = randomUUID();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CoreBankModule.forRoot('memory')],
    }).compile();
    core = moduleRef.get(CoreBankService);
  });

  const seedLedger = async (initialCents = 10_000) => {
    customerId = randomUUID();
    clearingId = randomUUID();
    cashId = randomUUID();
    await core.accounts.open({ accountClass: AccountClass.LIABILITY });
    const customer = await core.accounts.open({ accountClass: AccountClass.LIABILITY });
    const clearing = await core.accounts.open({ accountClass: AccountClass.LIABILITY });
    customerId = customer.id;
    clearingId = clearing.id;
    await core.accounts.open({ accountClass: AccountClass.ASSET });
    const cash = await core.accounts.open({ accountClass: AccountClass.ASSET });
    cashId = cash.id;
    await core.ledger.post({
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

  it('T01 — float é recusado na entrada', () => {
    expect(() => Money.fromCents(1.5)).toThrow(MoneyError);
  });

  it('T02 — overflow de BigInt é detectado', () => {
    expect(() => Money.fromCents(9_223_372_036_854_775_808n)).toThrow(MoneyError);
  });

  it('T03 — moedas diferentes não somam', () => {
    const usd = { amountCents: 1n, currency: 'USD' } as unknown as Money;
    expect(() => Money.fromCents(1n).add(usd)).toThrow(MoneyError);
  });

  it('T04 — percentageBps é determinístico', () => {
    const m = Money.fromCents(5000n);
    expect(m.percentageBps(1n).amountCents).toBe(m.percentageBps(1n).amountCents);
  });

  it('T05 — allocate não cria nem destrói centavo', () => {
    const total = Money.fromCents(10n);
    const sum = total.allocate(3).reduce((a, p) => a + p.amountCents, 0n);
    expect(sum).toBe(total.amountCents);
  });

  it('T06 — ValidationException tipada com domain', () => {
    const err = new ValidationException('x', 'TEST');
    expect(err.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(err.getBody().domain).toBe('CORE_BANKING');
  });

  it('T07 — ConflictException retorna 409', () => {
    expect(new ConflictException('x', 'C').getStatus()).toBe(HttpStatus.CONFLICT);
  });

  it('T08 — StateTransitionException retorna 422', () => {
    expect(new StateTransitionException('x', 'S').getStatus()).toBe(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  });

  it('T09 — open cria conta OPEN em BRL', async () => {
    const account = await core.accounts.open({ accountClass: AccountClass.LIABILITY });
    expect(account.status).toBe(AccountStatus.OPEN);
    expect(account.currency).toBe('BRL');
  });

  it('T10 — CLOSED é terminal', () => {
    const closed = LedgerAccount.open({
      id: 'x',
      accountClass: AccountClass.LIABILITY,
    }).transitionTo(AccountStatus.CLOSED);
    expect(() => closed.transitionTo(AccountStatus.OPEN)).toThrow(
      StateTransitionException,
    );
  });

  it('T11 — referência externa duplicada → Conflict', async () => {
    await core.accounts.open({
      accountClass: AccountClass.LIABILITY,
      externalReference: 'ext-dup',
    });
    await expect(
      core.accounts.open({
        accountClass: AccountClass.LIABILITY,
        externalReference: 'ext-dup',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('T12 — V001 proíbe mutação append-only', () => {
    expect(V001).toMatch(/LEDGER_APPEND_ONLY.*ledger_postings/is);
  });

  it('T13 — V001 valida D=C ao postar', () => {
    expect(V001).toMatch(/debit_sum\s*<>\s*credit_sum/i);
  });

  it('T14 — V002 view saldo assinado', () => {
    expect(V002).toMatch(/account_signed_balances/i);
  });

  it('T15 — V002 view saldo disponível', () => {
    expect(V002).toMatch(/available_balances/i);
  });

  it('T16 — cadeia íntegra passa verify()', async () => {
    await core.audit.append({ eventType: 'GATE', payload: { ok: true } });
    expect((await core.audit.verify()).valid).toBe(true);
  });

  it('T17 — adulteração detectada por verify()', async () => {
    const repo = new InMemoryAuditChainRepository();
    const audit = new AuditChainService(repo);
    const event = await audit.append({ eventType: 'TAMPER', payload: { v: 1 } });
    await repo.replaceForTest(event.id, { ...event, payload: { v: 9 } });
    expect((await audit.verify()).valid).toBe(false);
  });

  it('T18 — append outbox com publishedAt null', async () => {
    const event = await core.outbox.append({
      aggregateType: 'Payment',
      aggregateId: randomUUID(),
      eventType: 'Gate',
      payload: {},
    });
    expect(event.publishedAt).toBeNull();
  });

  it('T19 — markPublished idempotente', async () => {
    const event = await core.outbox.append({
      aggregateType: 'Payment',
      aggregateId: randomUUID(),
      eventType: 'Gate2',
      payload: {},
    });
    const first = await core.outbox.markPublished(event.id, '2026-06-29T10:00:00.000Z');
    const second = await core.outbox.markPublished(event.id);
    expect(second.publishedAt).toBe(first.publishedAt);
  });

  it('T20 — COMPLETED → Replay', async () => {
    const payload = { a: 1 };
    await core.idempotency.begin('t20', payload);
    await core.idempotency.complete('t20', 'ref');
    const result = await core.idempotency.begin('t20', payload);
    expect(result.action).toBe('REPLAY');
  });

  it('T21 — UNKNOWN → Blocked', async () => {
    await core.idempotency.begin('t21', { x: 1 });
    await core.idempotency.markUnknown('t21');
    const result = await core.idempotency.begin('t21', { x: 1 });
    expect(result.action).toBe('BLOCKED');
  });

  it('T22 — FAILED_RETRYABLE → Acquired', async () => {
    await core.idempotency.begin('t22', { x: 1 });
    await core.idempotency.failRetryable('t22');
    const result = await core.idempotency.begin('t22', { x: 1 });
    expect(result.action).toBe('ACQUIRED');
  });

  it('T23 — payload drift → Conflict', async () => {
    await core.idempotency.begin('t23', { a: 1 });
    await expect(core.idempotency.begin('t23', { a: 2 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('T24 — hold reduz saldo disponível', async () => {
    await seedLedger();
    await core.holds.place(customerId, Money.fromCents(2_000));
    expect((await core.holds.availableBalance(customerId)).equals(Money.fromCents(8_000))).toBe(
      true,
    );
  });

  it('T25 — hold acima do disponível → Conflict', async () => {
    await seedLedger(1_000);
    await expect(
      core.holds.place(customerId, Money.fromCents(2_000)),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('T26 — hold expirado para de reservar', async () => {
    await seedLedger();
    await core.holds.place(customerId, Money.fromCents(3_000), {
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(
      (
        await core.holds.availableBalance(customerId, new Date('2026-06-29T12:00:00.000Z'))
      ).equals(Money.fromCents(10_000)),
    ).toBe(true);
  });

  it('T27 — hold liberado restaura disponível', async () => {
    await seedLedger();
    const hold = await core.holds.place(customerId, Money.fromCents(1_500));
    await core.holds.release(hold.id);
    expect((await core.holds.availableBalance(customerId)).equals(Money.fromCents(10_000))).toBe(
      true,
    );
  });

  it('T28 — débitos ≠ créditos → ValidationException', async () => {
    await expect(
      core.ledger.post({
        correlationId,
        postings: [
          {
            ledgerAccountId: randomUUID(),
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.DEBIT,
            amount: Money.fromCents(100),
          },
          {
            ledgerAccountId: randomUUID(),
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.CREDIT,
            amount: Money.fromCents(90),
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('T29 — moedas misturadas → ValidationException', async () => {
    const usd = { amountCents: 100n, currency: 'USD' } as unknown as Money;
    await expect(
      core.ledger.post({
        correlationId,
        postings: [
          {
            ledgerAccountId: randomUUID(),
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.DEBIT,
            amount: Money.fromCents(100),
          },
          {
            ledgerAccountId: randomUUID(),
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.CREDIT,
            amount: usd,
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'LEDGER_MIXED_CURRENCY' });
  });

  it('T30 — linha zero → ValidationException', async () => {
    await expect(
      core.ledger.post({
        correlationId,
        postings: [
          {
            ledgerAccountId: randomUUID(),
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.DEBIT,
            amount: Money.zero(),
          },
          {
            ledgerAccountId: randomUUID(),
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.CREDIT,
            amount: Money.fromCents(1),
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'LEDGER_ZERO_LINE' });
  });

  it('T31 — idempotencyKey igual → replay ledger', async () => {
    const postings = [
      {
        ledgerAccountId: randomUUID(),
        accountClass: AccountClass.LIABILITY,
        side: PostingSide.DEBIT,
        amount: Money.fromCents(100),
      },
      {
        ledgerAccountId: randomUUID(),
        accountClass: AccountClass.LIABILITY,
        side: PostingSide.CREDIT,
        amount: Money.fromCents(100),
      },
    ];
    const first = await core.ledger.post({
      correlationId,
      idempotencyKey: 'ledger-replay',
      postings,
    });
    const second = await core.ledger.post({
      correlationId,
      idempotencyKey: 'ledger-replay',
      postings,
    });
    expect(second.id).toBe(first.id);
  });

  it('T32 — idempotencyKey drift → Conflict', async () => {
    await core.ledger.post({
      correlationId,
      idempotencyKey: 'ledger-drift',
      postings: [
        {
          ledgerAccountId: randomUUID(),
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.DEBIT,
          amount: Money.fromCents(100),
        },
        {
          ledgerAccountId: randomUUID(),
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: Money.fromCents(100),
        },
      ],
    });
    await expect(
      core.ledger.post({
        correlationId,
        idempotencyKey: 'ledger-drift',
        postings: [
          {
            ledgerAccountId: randomUUID(),
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.DEBIT,
            amount: Money.fromCents(200),
          },
          {
            ledgerAccountId: randomUUID(),
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.CREDIT,
            amount: Money.fromCents(200),
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('T33 — verifyEntryHash estável', async () => {
    const entry = await core.ledger.post({
      correlationId,
      postings: [
        {
          ledgerAccountId: randomUUID(),
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.DEBIT,
          amount: Money.fromCents(50),
        },
        {
          ledgerAccountId: randomUUID(),
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: Money.fromCents(50),
        },
      ],
    });
    expect(await core.ledger.verifyEntryHash(entry.id)).toBe(true);
  });

  it('T34 — reverse espelha sem editar original', async () => {
    const original = await core.ledger.post({
      correlationId,
      postings: [
        {
          ledgerAccountId: randomUUID(),
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.DEBIT,
          amount: Money.fromCents(80),
        },
        {
          ledgerAccountId: randomUUID(),
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: Money.fromCents(80),
        },
      ],
    });
    const reversal = await core.ledger.reverse(original.id, {
      idempotencyKey: 'rev-t34',
      correlationId,
    });
    expect(reversal.reversalOf).toBe(original.id);
    expect(reversal.postings[0]!.side).toBe(PostingSide.CREDIT);
  });

  it('T35 — segunda reversão → Conflict', async () => {
    const original = await core.ledger.post({
      correlationId,
      postings: [
        {
          ledgerAccountId: randomUUID(),
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.DEBIT,
          amount: Money.fromCents(40),
        },
        {
          ledgerAccountId: randomUUID(),
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: Money.fromCents(40),
        },
      ],
    });
    await core.ledger.reverse(original.id, {
      idempotencyKey: 'rev-t35-a',
      correlationId,
    });
    await expect(
      core.ledger.reverse(original.id, {
        idempotencyKey: 'rev-t35-b',
        correlationId,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('T36 — reversão de reversão → StateTransition', async () => {
    const original = await core.ledger.post({
      correlationId,
      postings: [
        {
          ledgerAccountId: randomUUID(),
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.DEBIT,
          amount: Money.fromCents(30),
        },
        {
          ledgerAccountId: randomUUID(),
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: Money.fromCents(30),
        },
      ],
    });
    const reversal = await core.ledger.reverse(original.id, {
      idempotencyKey: 'rev-t36',
      correlationId,
    });
    await expect(
      core.ledger.reverse(reversal.id, {
        idempotencyKey: 'rev-t36-b',
        correlationId,
      }),
    ).rejects.toBeInstanceOf(StateTransitionException);
  });

  it('T37 — fundos insuficientes → Conflict', async () => {
    await seedLedger(500);
    await expect(
      core.payments.create({
        debtorAccountId: customerId,
        creditorAccountId: clearingId,
        amount: Money.fromCents(600),
        idempotencyKey: 'pay-t37',
        correlationId,
      }),
    ).rejects.toMatchObject({ code: 'PAYMENT_INSUFFICIENT_FUNDS' });
  });

  it('T38 — UNKNOWN bloqueia retry', async () => {
    await seedLedger();
    const payment = await core.payments.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(500),
      idempotencyKey: 'pay-t38',
      correlationId,
    });
    await core.payments.markSent(payment.id);
    await core.payments.markUnknown(payment.id);
    await expect(
      core.payments.create({
        debtorAccountId: customerId,
        creditorAccountId: clearingId,
        amount: Money.fromCents(500),
        idempotencyKey: 'pay-t38',
        correlationId,
      }),
    ).rejects.toMatchObject({ code: 'PAYMENT_UNKNOWN_BLOCKS_RETRY' });
  });

  it('T39 — reconciliação SETTLED debita', async () => {
    await seedLedger();
    const payment = await core.payments.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(2_000),
      idempotencyKey: 'pay-t39',
      correlationId,
    });
    await core.payments.markSent(payment.id);
    await core.payments.markUnknown(payment.id);
    await core.reconciliation.open(payment.id, 'maker', 'ev');
    await core.reconciliation.resolve({
      paymentId: payment.id,
      resolution: ReconciliationResolution.SETTLED,
      evidenceRef: 'ev',
      makerId: 'maker',
      checkerId: 'checker',
    });
    expect(
      (await core.ledger.signedBalance(customerId, AccountClass.LIABILITY)).equals(
        Money.fromCents(8_000),
      ),
    ).toBe(true);
  });

  it('T40 — reconciliação REJECTED restaura', async () => {
    await seedLedger();
    const payment = await core.payments.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(1_800),
      idempotencyKey: 'pay-t40',
      correlationId,
    });
    await core.payments.markSent(payment.id);
    await core.payments.markUnknown(payment.id);
    await core.reconciliation.open(payment.id, 'maker2', 'ev2');
    await core.reconciliation.resolve({
      paymentId: payment.id,
      resolution: ReconciliationResolution.REJECTED,
      evidenceRef: 'ev2',
      makerId: 'maker2',
      checkerId: 'checker2',
    });
    expect((await core.holds.availableBalance(customerId)).equals(Money.fromCents(10_000))).toBe(
      true,
    );
  });

  it('T41 — 16 threads mesma chave → 1 efeito', async () => {
    await seedLedger();
    const key = 'pay-t41';
    const paymentRepo = moduleRef.get(InMemoryPaymentRepository);
    const countBefore = paymentRepo.countPayments();
    const attempts = await Promise.allSettled(
      Array.from({ length: 16 }, () =>
        core.payments.create({
          debtorAccountId: customerId,
          creditorAccountId: clearingId,
          amount: Money.fromCents(100),
          idempotencyKey: key,
          correlationId,
        }),
      ),
    );
    const fulfilled = attempts.filter((r) => r.status === 'fulfilled');
    expect(fulfilled.length).toBeGreaterThan(0);
    expect(paymentRepo.countPayments()).toBe(countBefore + 1);
    const byKey = await paymentRepo.findByIdempotencyKey(key);
    expect(byKey).not.toBeNull();
    const paymentIds = new Set(
      fulfilled.map((r) => (r as PromiseFulfilledResult<PaymentRecord>).value.id),
    );
    expect(paymentIds.size).toBe(1);
    expect(paymentIds.has(byKey!.id)).toBe(true);
  });

  it('T42 — ASSET clearing → ValidationException', async () => {
    await seedLedger();
    const asset = await core.accounts.open({ accountClass: AccountClass.ASSET });
    await expect(
      core.payments.create({
        debtorAccountId: customerId,
        creditorAccountId: asset.id,
        amount: Money.fromCents(100),
        idempotencyKey: 'pay-t42',
        correlationId,
      }),
    ).rejects.toMatchObject({ code: 'PAYMENT_ASSET_CLEARING_FORBIDDEN' });
  });

  it('T43 — EndToEndId formato BACEN', () => {
    const e2e = PixEngineService.generateEndToEndId(HOMOLOG_ISPB);
    expect(PixEngineService.validateEndToEndId(e2e)).toBe(true);
    expect(e2e.slice(1, 9)).toBe(HOMOLOG_ISPB);
  });

  it('T44 — HMAC da chave determinístico', () => {
    const secret = moduleRef.get<string>(PIX_HMAC_SECRET);
    const h1 = PixEngineService.hmacPixKey('key@mail.com', secret);
    const h2 = PixEngineService.hmacPixKey('KEY@MAIL.COM', secret);
    expect(h1).toBe(h2);
  });

  it('T45 — falha infra → idempotência FAILED_FINAL', async () => {
    await seedLedger();
    const accounts = moduleRef.get(InMemoryAccountRepository);
    const paymentRepo = new InMemoryPaymentRepository();
    const idemRepo = new InMemoryIdempotencyRepository();
    const idempotency = new IdempotencyService(idemRepo);
    const reconciliation = new ReconciliationService(
      new InMemoryReconciliationRepository(),
      paymentRepo,
      core.holds,
      core.ledger,
    );
    const failingEngine = new PaymentEngineService(
      paymentRepo,
      accounts,
      idempotency,
      core.holds,
      core.ledger,
      new OutboxService(new FailingOutboxRepository()),
      core.audit,
      reconciliation,
    );
    await expect(
      failingEngine.create({
        debtorAccountId: customerId,
        creditorAccountId: clearingId,
        amount: Money.fromCents(100),
        idempotencyKey: 'pay-t45',
        correlationId,
      }),
    ).rejects.toThrow('outbox indisponível');
    const record = await idemRepo.findByKey('pay-t45');
    expect(record?.state).toBe(IdempotencyState.FAILED_FINAL);
    expect(paymentRepo.countPayments()).toBe(0);
  });

  it('T46 — maker-checker obrigatório', async () => {
    await seedLedger();
    const payment = await core.payments.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      amount: Money.fromCents(900),
      idempotencyKey: 'pay-t46',
      correlationId,
    });
    await core.payments.markSent(payment.id);
    await core.payments.markUnknown(payment.id);
    await core.reconciliation.open(payment.id, 'same', 'ev');
    await expect(
      core.reconciliation.resolve({
        paymentId: payment.id,
        resolution: ReconciliationResolution.REJECTED,
        evidenceRef: 'ev',
        makerId: 'same',
        checkerId: 'same',
      }),
    ).rejects.toMatchObject({ code: 'RECONCILIATION_MAKER_CHECKER' });
  });

  it('T47 — CoreBankModule compõe domínio', async () => {
    await seedLedger();
    const manifest = core.getManifest();
    expect(manifest.domain).toBe('core-bank');
    expect(manifest.modules).toContain('payments');
    expect(manifest.modules).toContain('pix');
    expect(core.payments).toBe(moduleRef.get(PaymentEngineService));
    const pix = await core.pix.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      receiverKey: '52998224725',
      receiverKeyType: PixKeyType.CPF,
      amount: Money.fromCents(200),
      idempotencyKey: 'pix-t47',
      correlationId,
    });
    expect(pix.paymentId).toBeTruthy();
    const paymentRepo = moduleRef.get(InMemoryPaymentRepository);
    const loaded = await paymentRepo.findById(pix.paymentId);
    expect(loaded?.status).toBe(PaymentStatus.CREATED);
  });
});