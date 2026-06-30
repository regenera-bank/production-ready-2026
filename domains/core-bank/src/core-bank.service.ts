import { Injectable } from '@nestjs/common';
import { resolveStorageMode } from './storage/storage.config';
import { AccountRegistryService } from './accounts/account-registry.service';
import { AuditChainService } from './audit/audit-chain.service';
import { HoldBookService } from './holds/hold-book.service';
import { IdempotencyService } from './idempotency/idempotency.service';
import { LedgerService } from './ledger/ledger.service';
import { OutboxService } from './outbox/outbox.service';
import { PaymentEngineService } from './payments/payment-engine.service';
import { PixEngineService } from './pix/pix-engine.service';
import { ReconciliationService } from './reconciliation/reconciliation.service';

export type CoreBankPersistence = 'in-memory' | 'postgres';

export interface CoreBankModuleManifest {
  domain: string;
  version: string;
  persistence: CoreBankPersistence;
  modules: string[];
}

@Injectable()
export class CoreBankService {
  constructor(
    public readonly accounts: AccountRegistryService,
    public readonly ledger: LedgerService,
    public readonly holds: HoldBookService,
    public readonly idempotency: IdempotencyService,
    public readonly outbox: OutboxService,
    public readonly audit: AuditChainService,
    public readonly payments: PaymentEngineService,
    public readonly pix: PixEngineService,
    public readonly reconciliation: ReconciliationService,
  ) {}

  getManifest(): CoreBankModuleManifest {
    return {
      domain: 'core-bank',
      version: '0.0.1',
      persistence:
        resolveStorageMode() === 'memory' ? 'in-memory' : 'postgres',
      modules: [
        'money',
        'errors',
        'accounts',
        'ledger',
        'holds',
        'idempotency',
        'outbox',
        'audit',
        'payments',
        'pix',
        'reconciliation',
      ],
    };
  }
}