import { Test, TestingModule } from '@nestjs/testing';
import { LedgerReadonlyController } from './ledger-readonly.controller';
import { LedgerReadonlyService } from './ledger-readonly.service';

describe('LedgerReadonlyController', () => {
  let controller: LedgerReadonlyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LedgerReadonlyController],
      providers: [LedgerReadonlyService],
    }).compile();

    controller = module.get<LedgerReadonlyController>(LedgerReadonlyController);
  });

  it('lists read-only accounts', () => {
    const accounts = controller.listAccounts();
    expect(accounts.length).toBeGreaterThan(0);
    expect(accounts.every((a) => a.readOnly)).toBe(true);
  });

  it('filters entries by account', () => {
    const entries = controller.listEntries('ACC-001');
    expect(entries.every((e) => e.accountId === 'ACC-001')).toBe(true);
  });
});