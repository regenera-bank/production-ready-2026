import { DynamicModule, Module, Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { AccountRegistryService } from './accounts/account-registry.service';
import { InMemoryAccountRepository } from './accounts/in-memory-account.repository';
import { AccountRepository } from './accounts/account.repository';
import { AuditChainService } from './audit/audit-chain.service';
import { InMemoryAuditChainRepository } from './audit/in-memory-audit-chain.repository';
import { AuditChainRepository } from './audit/audit-chain.repository';
import { CoreBankService } from './core-bank.service';
import { PostgresBootstrapService } from './db/postgres-bootstrap.service';
import { createPostgresPool } from './db/postgres-pool';
import { PostgresAccountRepository } from './db/postgres/postgres-account.repository';
import { PostgresAuditChainRepository } from './db/postgres/postgres-audit-chain.repository';
import { PostgresHoldRepository } from './db/postgres/postgres-hold.repository';
import { PostgresIdempotencyRepository } from './db/postgres/postgres-idempotency.repository';
import { PostgresLedgerRepository } from './db/postgres/postgres-ledger.repository';
import { PostgresOutboxRepository } from './db/postgres/postgres-outbox.repository';
import { PostgresPaymentRepository } from './db/postgres/postgres-payment.repository';
import { PostgresPixRepository } from './db/postgres/postgres-pix.repository';
import { PostgresReconciliationRepository } from './db/postgres/postgres-reconciliation.repository';
import { HoldBookService } from './holds/hold-book.service';
import { InMemoryHoldRepository } from './holds/in-memory-hold.repository';
import { HoldRepository } from './holds/hold.repository';
import { LedgerSignedBalanceProvider } from './holds/ledger-signed-balance.provider';
import { IdempotencyService } from './idempotency/idempotency.service';
import { InMemoryIdempotencyRepository } from './idempotency/in-memory-idempotency.repository';
import { IdempotencyRepository } from './idempotency/idempotency.repository';
import { InMemoryLedgerRepository } from './ledger/in-memory-ledger.repository';
import { LedgerRepository } from './ledger/ledger.repository';
import { LedgerService } from './ledger/ledger.service';
import { InMemoryOutboxRepository } from './outbox/in-memory-outbox.repository';
import { OutboxRepository } from './outbox/outbox.repository';
import { OutboxService } from './outbox/outbox.service';
import { InMemoryPaymentRepository } from './payments/in-memory-payment.repository';
import { PaymentRepository } from './payments/payment.repository';
import { PaymentEngineService } from './payments/payment-engine.service';
import { InMemoryPixRepository } from './pix/in-memory-pix.repository';
import { PixRepository } from './pix/pix.repository';
import { PixEngineService } from './pix/pix-engine.service';
import { InMemoryReconciliationRepository } from './reconciliation/in-memory-reconciliation.repository';
import { ReconciliationRepository } from './reconciliation/reconciliation.repository';
import { ReconciliationService } from './reconciliation/reconciliation.service';
import { resolveStorageMode } from './storage/storage.config';
import {
  ACCOUNT_REPOSITORY,
  AUDIT_CHAIN_REPOSITORY,
  HOLD_REPOSITORY,
  IDEMPOTENCY_REPOSITORY,
  LEDGER_REPOSITORY,
  OUTBOX_REPOSITORY,
  PAYMENT_REPOSITORY,
  PIX_REPOSITORY,
  POSTGRES_POOL,
  RECONCILIATION_REPOSITORY,
  StorageMode,
} from './storage/storage.tokens';

export const PIX_HMAC_SECRET = Symbol('PIX_HMAC_SECRET');
const DEFAULT_PIX_HMAC_SECRET = 'homolog-pix-hmac-secret';

function repositoryProviders(mode: StorageMode): Provider[] {
  if (mode === 'memory') {
    return [
      InMemoryAccountRepository,
      InMemoryPaymentRepository,
      InMemoryLedgerRepository,
      InMemoryHoldRepository,
      InMemoryIdempotencyRepository,
      InMemoryOutboxRepository,
      InMemoryAuditChainRepository,
      InMemoryReconciliationRepository,
      InMemoryPixRepository,
      { provide: ACCOUNT_REPOSITORY, useExisting: InMemoryAccountRepository },
      { provide: PAYMENT_REPOSITORY, useExisting: InMemoryPaymentRepository },
      { provide: LEDGER_REPOSITORY, useExisting: InMemoryLedgerRepository },
      { provide: HOLD_REPOSITORY, useExisting: InMemoryHoldRepository },
      { provide: IDEMPOTENCY_REPOSITORY, useExisting: InMemoryIdempotencyRepository },
      { provide: OUTBOX_REPOSITORY, useExisting: InMemoryOutboxRepository },
      { provide: AUDIT_CHAIN_REPOSITORY, useExisting: InMemoryAuditChainRepository },
      {
        provide: RECONCILIATION_REPOSITORY,
        useExisting: InMemoryReconciliationRepository,
      },
      { provide: PIX_REPOSITORY, useExisting: InMemoryPixRepository },
    ];
  }

  return [
    {
      provide: POSTGRES_POOL,
      useFactory: () => createPostgresPool(),
    },
    PostgresAccountRepository,
    PostgresPaymentRepository,
    PostgresLedgerRepository,
    PostgresHoldRepository,
    PostgresIdempotencyRepository,
    PostgresOutboxRepository,
    PostgresAuditChainRepository,
    PostgresReconciliationRepository,
    PostgresPixRepository,
    PostgresBootstrapService,
    { provide: ACCOUNT_REPOSITORY, useExisting: PostgresAccountRepository },
    { provide: PAYMENT_REPOSITORY, useExisting: PostgresPaymentRepository },
    { provide: LEDGER_REPOSITORY, useExisting: PostgresLedgerRepository },
    { provide: HOLD_REPOSITORY, useExisting: PostgresHoldRepository },
    { provide: IDEMPOTENCY_REPOSITORY, useExisting: PostgresIdempotencyRepository },
    { provide: OUTBOX_REPOSITORY, useExisting: PostgresOutboxRepository },
    { provide: AUDIT_CHAIN_REPOSITORY, useExisting: PostgresAuditChainRepository },
    {
      provide: RECONCILIATION_REPOSITORY,
      useExisting: PostgresReconciliationRepository,
    },
    { provide: PIX_REPOSITORY, useExisting: PostgresPixRepository },
  ];
}

function serviceProviders(): Provider[] {
  return [
    {
      provide: PIX_HMAC_SECRET,
      useValue: process.env.PIX_HMAC_SECRET ?? DEFAULT_PIX_HMAC_SECRET,
    },
    {
      provide: LedgerService,
      useFactory: (repo: LedgerRepository) => new LedgerService(repo),
      inject: [LEDGER_REPOSITORY],
    },
    {
      provide: LedgerSignedBalanceProvider,
      useFactory: (ledger: LedgerService, accounts: AccountRepository) =>
        new LedgerSignedBalanceProvider(ledger, accounts),
      inject: [LedgerService, ACCOUNT_REPOSITORY],
    },
    {
      provide: HoldBookService,
      useFactory: (holds: HoldRepository, balances: LedgerSignedBalanceProvider) =>
        new HoldBookService(holds, balances),
      inject: [HOLD_REPOSITORY, LedgerSignedBalanceProvider],
    },
    {
      provide: IdempotencyService,
      useFactory: (repo: IdempotencyRepository) => new IdempotencyService(repo),
      inject: [IDEMPOTENCY_REPOSITORY],
    },
    {
      provide: OutboxService,
      useFactory: (repo: OutboxRepository) => new OutboxService(repo),
      inject: [OUTBOX_REPOSITORY],
    },
    {
      provide: AuditChainService,
      useFactory: (repo: AuditChainRepository) => new AuditChainService(repo),
      inject: [AUDIT_CHAIN_REPOSITORY],
    },
    {
      provide: AccountRegistryService,
      useFactory: (accounts: AccountRepository) =>
        new AccountRegistryService(accounts),
      inject: [ACCOUNT_REPOSITORY],
    },
    {
      provide: ReconciliationService,
      useFactory: (
        cases: ReconciliationRepository,
        payments: PaymentRepository,
        holds: HoldBookService,
        ledger: LedgerService,
      ) => new ReconciliationService(cases, payments, holds, ledger),
      inject: [
        RECONCILIATION_REPOSITORY,
        PAYMENT_REPOSITORY,
        HoldBookService,
        LedgerService,
      ],
    },
    {
      provide: PaymentEngineService,
      useFactory: (
        payments: PaymentRepository,
        accounts: AccountRepository,
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
        PAYMENT_REPOSITORY,
        ACCOUNT_REPOSITORY,
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
        pix: PixRepository,
        payments: PaymentEngineService,
        secret: string,
      ) => new PixEngineService(pix, payments, secret),
      inject: [PIX_REPOSITORY, PaymentEngineService, PIX_HMAC_SECRET],
    },
    CoreBankService,
  ];
}

@Module({})
export class CoreBankModule {
  static forRoot(mode?: StorageMode): DynamicModule {
    const storageMode = mode ?? resolveStorageMode();

    const exports: DynamicModule['exports'] = [
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
      ACCOUNT_REPOSITORY,
      LEDGER_REPOSITORY,
      IDEMPOTENCY_REPOSITORY,
      OUTBOX_REPOSITORY,
      PAYMENT_REPOSITORY,
      HOLD_REPOSITORY,
      AUDIT_CHAIN_REPOSITORY,
      RECONCILIATION_REPOSITORY,
      PIX_REPOSITORY,
    ];

    if (storageMode === 'postgres') {
      exports.push(POSTGRES_POOL);
    }

    return {
      module: CoreBankModule,
      providers: [...repositoryProviders(storageMode), ...serviceProviders()],
      exports,
    };
  }
}

