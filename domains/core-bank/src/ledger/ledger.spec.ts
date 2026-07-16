import { randomUUID } from 'crypto';
import { AccountClass } from '../accounts/account.entity';
import { Money } from '../money/money.value-object';
import {
  ConflictException,
  NotFoundException,
  StateTransitionException,
  ValidationException,
} from '../errors/core-banking.errors';
import { LedgerService } from './ledger.service';
import { InMemoryLedgerRepository } from './in-memory-ledger.repository';
import { PostingLineInput, PostingSide } from './ledger.entity';

describe('LedgerService (PR-09)', () => {
  const CORRELATION = randomUUID();
  const CUSTOMER = 'acc-customer-liability';
  const CLEARING = 'acc-clearing-liability';
  const CASH = 'acc-cash-asset';

  let repository: InMemoryLedgerRepository;
  let service: LedgerService;

  const transfer = (
    amountCents: number,
    debitAccount = CUSTOMER,
    creditAccount = CLEARING,
    debitClass = AccountClass.LIABILITY,
    creditClass = AccountClass.LIABILITY,
  ): PostingLineInput[] => [
    {
      ledgerAccountId: debitAccount,
      accountClass: debitClass,
      side: PostingSide.DEBIT,
      amount: Money.fromCents(amountCents),
    },
    {
      ledgerAccountId: creditAccount,
      accountClass: creditClass,
      side: PostingSide.CREDIT,
      amount: Money.fromCents(amountCents),
    },
  ];

  beforeEach(() => {
    repository = new InMemoryLedgerRepository();
    service = new LedgerService(repository);
  });

  it('débitos ≠ créditos → ValidationException antes de POSTED', async () => {
    await expect(
      service.post({
        correlationId: CORRELATION,
        postings: [
          {
            ledgerAccountId: CUSTOMER,
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.DEBIT,
            amount: Money.fromCents(1_000),
          },
          {
            ledgerAccountId: CLEARING,
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.CREDIT,
            amount: Money.fromCents(900),
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'LEDGER_IMBALANCE' });
    await expect(
      service.post({
        correlationId: CORRELATION,
        postings: transfer(1_000),
      }),
    ).resolves.toBeDefined();
  });

  it('moedas misturadas → ValidationException', async () => {
    const brl = Money.fromCents(1_000);
    const usd = { amountCents: 1_000n, currency: 'USD' } as unknown as Money;

    await expect(
      service.post({
        correlationId: CORRELATION,
        postings: [
          {
            ledgerAccountId: CUSTOMER,
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.DEBIT,
            amount: brl,
          },
          {
            ledgerAccountId: CLEARING,
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.CREDIT,
            amount: usd,
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'LEDGER_MIXED_CURRENCY' });
    await expect(
      service.post({
        correlationId: CORRELATION,
        postings: transfer(1_000),
      }),
    ).resolves.toBeDefined();
  });

  it('linha com valor zero → ValidationException', async () => {
    await expect(
      service.post({
        correlationId: CORRELATION,
        postings: [
          {
            ledgerAccountId: CUSTOMER,
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.DEBIT,
            amount: Money.zero(),
          },
          {
            ledgerAccountId: CLEARING,
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.CREDIT,
            amount: Money.fromCents(1_000),
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'LEDGER_ZERO_LINE' });
    await expect(
      service.post({
        correlationId: CORRELATION,
        postings: transfer(1_000),
      }),
    ).resolves.toBeDefined();
  });

  it('mesmo idempotencyKey + payload igual → retorna original', async () => {
    const key = 'idem-ledger-001';
    const postings = transfer(2_500);
    const first = await service.post({
      correlationId: CORRELATION,
      idempotencyKey: key,
      postings,
    });
    const second = await service.post({
      correlationId: randomUUID(),
      idempotencyKey: key,
      postings,
    });
    expect(second.id).toBe(first.id);
    expect(second.entryHash).toBe(first.entryHash);
  });

  it('mesmo idempotencyKey + payload diferente → ConflictException', async () => {
    const key = 'idem-ledger-002';
    await service.post({
      correlationId: CORRELATION,
      idempotencyKey: key,
      postings: transfer(1_000),
    });
    await expect(
      service.post({
        correlationId: CORRELATION,
        idempotencyKey: key,
        postings: transfer(2_000),
      }),
    ).rejects.toMatchObject({ code: 'LEDGER_IDEMPOTENCY_PAYLOAD_DRIFT' });
    await expect(
      service.post({
        correlationId: CORRELATION,
        idempotencyKey: key,
        postings: transfer(2_000),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('verifyEntryHash permanece estável após persistência', async () => {
    const entry = await service.post({
      correlationId: CORRELATION,
      postings: transfer(3_300),
    });
    const persisted = await repository.findById(entry.id);
    expect(persisted).not.toBeNull();
    expect(await service.verifyEntryHash(entry.id)).toBe(true);
    expect(entry.entryHash).toBe(persisted!.entryHash);
  });

  it('reverse cria partidas espelhadas — não edita original', async () => {
    const original = await service.post({
      correlationId: CORRELATION,
      postings: transfer(4_000),
    });
    const reversal = await service.reverse(original.id, {
      idempotencyKey: 'rev-001',
      correlationId: randomUUID(),
    });

    const reloaded = await repository.findById(original.id);
    expect(reloaded!.postings).toEqual(original.postings);
    expect(reloaded!.status).toBe(original.status);
    expect(reversal.reversalOf).toBe(original.id);
    expect(reversal.postings[0]!.side).toBe(PostingSide.CREDIT);
    expect(reversal.postings[1]!.side).toBe(PostingSide.DEBIT);
    expect(reversal.postings[0]!.amount.equals(original.postings[0]!.amount)).toBe(
      true,
    );
  });

  it('segunda reversão → ConflictException', async () => {
    const original = await service.post({
      correlationId: CORRELATION,
      postings: transfer(1_500),
    });
    await service.reverse(original.id, {
      idempotencyKey: 'rev-002-a',
      correlationId: randomUUID(),
    });
    await expect(
      service.reverse(original.id, {
        idempotencyKey: 'rev-002-b',
        correlationId: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: 'LEDGER_ALREADY_REVERSED' });
  });

  it('reversão de reversão → StateTransitionException', async () => {
    const original = await service.post({
      correlationId: CORRELATION,
      postings: transfer(800),
    });
    const reversal = await service.reverse(original.id, {
      idempotencyKey: 'rev-003',
      correlationId: randomUUID(),
    });
    await expect(
      service.reverse(reversal.id, {
        idempotencyKey: 'rev-003-b',
        correlationId: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: 'LEDGER_REVERSE_OF_REVERSAL' });
    await expect(
      service.reverse(reversal.id, {
        idempotencyKey: 'rev-003-b',
        correlationId: randomUUID(),
      }),
    ).rejects.toBeInstanceOf(StateTransitionException);
  });

  it('lançamento com menos de duas partidas → ValidationException', async () => {
    await expect(
      service.post({
        correlationId: CORRELATION,
        postings: [
          {
            ledgerAccountId: CUSTOMER,
            accountClass: AccountClass.LIABILITY,
            side: PostingSide.DEBIT,
            amount: Money.fromCents(100),
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'LEDGER_EMPTY_ENTRY' });
    await expect(
      service.post({
        correlationId: CORRELATION,
        postings: [],
      }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('signedBalance deriva saldo só de journals POSTED (V002)', async () => {
    await service.post({
      correlationId: CORRELATION,
      postings: [
        {
          ledgerAccountId: CASH,
          accountClass: AccountClass.ASSET,
          side: PostingSide.DEBIT,
          amount: Money.fromCents(5_000),
        },
        {
          ledgerAccountId: CUSTOMER,
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: Money.fromCents(5_000),
        },
      ],
    });

    const cash = await service.signedBalance(CASH, AccountClass.ASSET);
    const customer = await service.signedBalance(CUSTOMER, AccountClass.LIABILITY);
    expect(cash.equals(Money.fromCents(5_000))).toBe(true);
    expect(customer.equals(Money.fromCents(5_000))).toBe(true);
  });

  it('reverse em lançamento inexistente → NotFoundException', async () => {
    await expect(
      service.reverse('00000000-0000-0000-0000-000000000099', {
        idempotencyKey: 'rev-missing',
        correlationId: CORRELATION,
      }),
    ).rejects.toMatchObject({ code: 'LEDGER_NOT_FOUND' });
    await expect(
      service.reverse('00000000-0000-0000-0000-000000000099', {
        idempotencyKey: 'rev-missing',
        correlationId: CORRELATION,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});