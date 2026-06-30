import { Module } from '@nestjs/common';
import { AccountRegistryService } from './accounts/account-registry.service';
import { InMemoryAccountRepository } from './accounts/in-memory-account.repository';
import { AuditChainService } from './audit/audit-chain.service';
import { InMemoryAuditChainRepository } from './audit/in-memory-audit-chain.repository';
import { CoreBankService } from './core-bank.service';
import { HoldBookService } from './holds/hold-book.service';
import { InMemoryHoldRepository } from './holds/in-memory-hold.repository';
import { LedgerSignedBalanceProvider } from './holds/ledger-signed-balance.provider';
import { IdempotencyService } from './idempotency/idempotency.service';
import { InMemoryIdempotencyRepository } from './idempotency/in-memory-idempotency.repository';
import { InMemoryLedgerRepository } from './ledger/in-memory-ledger.repository';
import { LedgerService } from './ledger/ledger.service';
import { InMemoryOutboxRepository } from './outbox/in-memory-outbox.repository';
import { OutboxService } from './outbox/outbox.service';
import { InMemoryPaymentRepository } from './payments/in-memory-payment.repository';
import { PaymentEngineService } from './payments/payment-engine.service';
import { InMemoryPixRepository } from './pix/in-memory-pix.repository';
import { PixEngineService } from './pix/pix-engine.service';
import { InMemoryReconciliationRepository } from './reconciliation/in-memory-reconciliation.repository';
import { ReconciliationService } from './reconciliation/reconciliation.service';

export const PIX_HMAC_SECRET = Symbol('PIX_HMAC_SECRET');
const DEFAULT_PIX_HMAC_SECRET = 'homolog-pix-hmac-secret';

@Module({
  providers: [
    InMemoryAccountRepository,
    InMemoryPaymentRepository,
    InMemoryLedgerRepository,
    InMemoryHoldRepository,
    InMemoryIdempotencyRepository,
    InMemoryOutboxRepository,
    InMemoryAuditChainRepository,
    InMemoryReconciliationRepository,
    InMemoryPixRepository,
    {
      provide: PIX_HMAC_SECRET,
      useValue: process.env.PIX_HMAC_SECRET ?? DEFAULT_PIX_HMAC_SECRET,
    },
    {
      provide: LedgerService,
      useFactory: (repo: InMemoryLedgerRepository) => new LedgerService(repo),
      inject: [InMemoryLedgerRepository],
    },
    {
      provide: LedgerSignedBalanceProvider,
      useFactory: (
        ledger: LedgerService,
        accounts: InMemoryAccountRepository,
      ) => new LedgerSignedBalanceProvider(ledger, accounts),
      inject: [LedgerService, InMemoryAccountRepository],
    },
    {
      provide: HoldBookService,
      useFactory: (
        holds: InMemoryHoldRepository,
        balances: LedgerSignedBalanceProvider,
      ) => new HoldBookService(holds, balances),
      inject: [InMemoryHoldRepository, LedgerSignedBalanceProvider],
    },
    {
      provide: IdempotencyService,
      useFactory: (repo: InMemoryIdempotencyRepository) =>
        new IdempotencyService(repo),
      inject: [InMemoryIdempotencyRepository],
    },
    {
      provide: OutboxService,
      useFactory: (repo: InMemoryOutboxRepository) => new OutboxService(repo),
      inject: [InMemoryOutboxRepository],
    },
    {
      provide: AuditChainService,
      useFactory: (repo: InMemoryAuditChainRepository) =>
        new AuditChainService(repo),
      inject: [InMemoryAuditChainRepository],
    },
    {
      provide: AccountRegistryService,
      useFactory: (accounts: InMemoryAccountRepository) =>
        new AccountRegistryService(accounts),
      inject: [InMemoryAccountRepository],
    },
    {
      provide: ReconciliationService,
      useFactory: (
        cases: InMemoryReconciliationRepository,
        payments: InMemoryPaymentRepository,
        holds: HoldBookService,
        ledger: LedgerService,
      ) => new ReconciliationService(cases, payments, holds, ledger),
      inject: [
        InMemoryReconciliationRepository,
        InMemoryPaymentRepository,
        HoldBookService,
        LedgerService,
      ],
    },
    {
      provide: PaymentEngineService,
      useFactory: (
        payments: InMemoryPaymentRepository,
        accounts: InMemoryAccountRepository,
        idempotency: IdempotencyService,
        holds: HoldBookService,
        ledger: LedgerService,
        outbox: OutboxService,
        audit: AuditChainService,
        reconciliation: ReconciliationService,
      ) =>
        new PaymentEngineService(
          payments,
          accounts,
          idempotency,
          holds,
          ledger,
          outbox,
          audit,
          reconciliation,
        ),
      inject: [
        InMemoryPaymentRepository,
        InMemoryAccountRepository,
        IdempotencyService,
        HoldBookService,
        LedgerService,
        OutboxService,
        AuditChainService,
        ReconciliationService,
      ],
    },
    {
      provide: PixEngineService,
      useFactory: (
        pix: InMemoryPixRepository,
        payments: PaymentEngineService,
        secret: string,
      ) => new PixEngineService(pix, payments, secret),
      inject: [InMemoryPixRepository, PaymentEngineService, PIX_HMAC_SECRET],
    },
    CoreBankService,
  ],
  exports: [
    CoreBankService,
    AccountRegistryService,
    LedgerService,
    HoldBookService,
    PaymentEngineService,
    PixEngineService,
    ReconciliationService,
    IdempotencyService,
    OutboxService,
    AuditChainService,
  ],
})
export class CoreBankModule {}