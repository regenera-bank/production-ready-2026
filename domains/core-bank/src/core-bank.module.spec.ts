import { Test, TestingModule } from '@nestjs/testing';
import { AccountRegistryService } from './accounts/account-registry.service';
import { CoreBankModule } from './core-bank.module';
import { CoreBankService } from './core-bank.service';
import { LedgerService } from './ledger/ledger.service';
import { PaymentEngineService } from './payments/payment-engine.service';
import { PixEngineService } from './pix/pix-engine.service';
import { ReconciliationService } from './reconciliation/reconciliation.service';

describe('CoreBankModule (PR-13)', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CoreBankModule],
    }).compile();
  });

  it('compila o módulo NestJS', () => {
    expect(moduleRef).toBeDefined();
  });

  it('resolve CoreBankService com manifesto do domínio', () => {
    const core = moduleRef.get(CoreBankService);
    const manifest = core.getManifest();
    expect(manifest.domain).toBe('core-bank');
    expect(manifest.persistence).toBe('in-memory');
    expect(manifest.modules).toContain('payments');
    expect(manifest.modules).toContain('pix');
    expect(manifest.modules).toContain('reconciliation');
  });

  it('resolve serviços financeiros do DAG', () => {
    expect(moduleRef.get(AccountRegistryService)).toBeInstanceOf(
      AccountRegistryService,
    );
    expect(moduleRef.get(LedgerService)).toBeInstanceOf(LedgerService);
    expect(moduleRef.get(PaymentEngineService)).toBeInstanceOf(
      PaymentEngineService,
    );
    expect(moduleRef.get(PixEngineService)).toBeInstanceOf(PixEngineService);
    expect(moduleRef.get(ReconciliationService)).toBeInstanceOf(
      ReconciliationService,
    );
  });

  it('CoreBankService expõe as mesmas instâncias injetadas', () => {
    const core = moduleRef.get(CoreBankService);
    expect(core.payments).toBe(moduleRef.get(PaymentEngineService));
    expect(core.pix).toBe(moduleRef.get(PixEngineService));
    expect(core.reconciliation).toBe(moduleRef.get(ReconciliationService));
  });
});