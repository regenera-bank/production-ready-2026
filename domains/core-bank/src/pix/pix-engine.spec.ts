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
import { ReconciliationService } from '../reconciliation/reconciliation.service';
import { InMemoryReconciliationRepository } from '../reconciliation/in-memory-reconciliation.repository';
import { ValidationException } from '../errors/core-banking.errors';
import { PixEngineService } from './pix-engine.service';
import { InMemoryPixRepository } from './in-memory-pix.repository';
import { HOMOLOG_ISPB, PixKeyType } from './pix.entity';

describe('PixEngineService (PR-11)', () => {
  const HMAC_SECRET = 'homolog-pix-hmac-secret';
  const CORRELATION = randomUUID();

  let customerId: string;
  let clearingId: string;
  let cashId: string;
  let pixRepo: InMemoryPixRepository;
  let engine: PixEngineService;

  const setupPaymentStack = () => {
    const accounts = new InMemoryAccountRepository();
    const payments = new InMemoryPaymentRepository();
    const ledgerRepo = new InMemoryLedgerRepository();
    const ledger = new LedgerService(ledgerRepo);
    const holds = new HoldBookService(
      new InMemoryHoldRepository(),
      new LedgerSignedBalanceProvider(ledger, accounts),
    );
    const reconciliation = new ReconciliationService(
      new InMemoryReconciliationRepository(),
      payments,
      holds,
      ledger,
    );
    const paymentEngine = new PaymentEngineService(
      payments,
      accounts,
      new IdempotencyService(new InMemoryIdempotencyRepository()),
      holds,
      ledger,
      new OutboxService(new InMemoryOutboxRepository()),
      new AuditChainService(new InMemoryAuditChainRepository()),
      reconciliation,
    );
    pixRepo = new InMemoryPixRepository();
    engine = new PixEngineService(pixRepo, paymentEngine, HMAC_SECRET);
    return { accounts, ledger };
  };

  const seedAccounts = async (
    accounts: InMemoryAccountRepository,
    ledger: LedgerService,
    initialCents = 10_000,
  ) => {
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

  beforeEach(async () => {
    const { accounts, ledger } = setupPaymentStack();
    await seedAccounts(accounts, ledger);
  });

  it('EndToEndId segue formato BACEN E{ISPB}{yyyyMMddHHmm}{11 alphanum}', () => {
    const at = new Date('2026-06-29T19:09:00.000Z');
    const e2e = PixEngineService.generateEndToEndId(HOMOLOG_ISPB, at);
    expect(e2e.startsWith(`E${HOMOLOG_ISPB}202606291909`)).toBe(true);
    expect(e2e).toHaveLength(32);
    expect(PixEngineService.validateEndToEndId(e2e)).toBe(true);
  });

  it('validateEndToEndId rejeita formato inválido', () => {
    expect(PixEngineService.validateEndToEndId('E1234567820260629090SHORT')).toBe(
      false,
    );
    expect(PixEngineService.validateEndToEndId('not-an-e2e')).toBe(false);
  });

  it('hmacPixKey é determinístico e não expõe a chave', () => {
    const h1 = PixEngineService.hmacPixKey('Finance@Regenera.Bank', HMAC_SECRET);
    const h2 = PixEngineService.hmacPixKey('finance@regenera.bank', HMAC_SECRET);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
    expect(h1).not.toContain('finance');
  });

  it('maskReceiverKey mascara CPF sem expor dígitos centrais', () => {
    expect(PixEngineService.maskReceiverKey('529.982.247-25', PixKeyType.CPF)).toBe(
      '***.***.***-25',
    );
  });

  it('maskReceiverKey mascara e-mail e telefone', () => {
    expect(
      PixEngineService.maskReceiverKey('cliente@regenerabank.world', PixKeyType.EMAIL),
    ).toBe('c***@regenerabank.world');
    expect(
      PixEngineService.maskReceiverKey('+5511999887766', PixKeyType.PHONE),
    ).toBe('+55 ** *****-7766');
  });

  it('create gera Pix com E2E, HMAC e recebedor mascarado', async () => {
    const pix = await engine.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      receiverKey: '52998224725',
      receiverKeyType: PixKeyType.CPF,
      amount: Money.fromCents(1_500),
      idempotencyKey: 'pix-idem-001',
      correlationId: CORRELATION,
    });
    expect(PixEngineService.validateEndToEndId(pix.endToEndId)).toBe(true);
    expect(pix.endToEndId.slice(1, 9)).toBe(HOMOLOG_ISPB);
    expect(pix.receiverMasked).toBe('***.***.***-25');
    expect(pix.receiverKeyHmac).toBe(
      PixEngineService.hmacPixKey('52998224725', HMAC_SECRET),
    );
    expect(pix.paymentId).toBeTruthy();
  });

  it('chave Pix inválida → ValidationException', async () => {
    await expect(
      engine.create({
        debtorAccountId: customerId,
        creditorAccountId: clearingId,
        receiverKey: '123',
        receiverKeyType: PixKeyType.CPF,
        amount: Money.fromCents(100),
        idempotencyKey: 'pix-invalid-key',
        correlationId: CORRELATION,
      }),
    ).rejects.toMatchObject({ code: 'PIX_KEY_INVALID_CPF' });
    await expect(
      engine.create({
        debtorAccountId: customerId,
        creditorAccountId: clearingId,
        receiverKey: '123',
        receiverKeyType: PixKeyType.CPF,
        amount: Money.fromCents(100),
        idempotencyKey: 'pix-invalid-key-2',
        correlationId: CORRELATION,
      }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('EVP válida é aceita', async () => {
    const pix = await engine.create({
      debtorAccountId: customerId,
      creditorAccountId: clearingId,
      receiverKey: '550e8400-e29b-41d4-a716-446655440000',
      receiverKeyType: PixKeyType.EVP,
      amount: Money.fromCents(500),
      idempotencyKey: 'pix-evp-001',
      correlationId: CORRELATION,
    });
    expect(pix.receiverMasked).toBe('550e...0000');
  });

  it('ISPB inválido na geração manual → PIX_INVALID_ISPB', () => {
    expect(() => PixEngineService.generateEndToEndId('123')).toThrow(
      ValidationException,
    );
  });
});