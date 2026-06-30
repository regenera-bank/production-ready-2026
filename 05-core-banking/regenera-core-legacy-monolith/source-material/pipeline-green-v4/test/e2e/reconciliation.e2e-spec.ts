import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { ReconciliationService } from '../../src/reconciliation/reconciliation.service';
import { Repository } from 'typeorm';
import { AccountEntity } from '../../src/core/entities/account.entity';
import { TransactionEntity } from '../../src/core/entities/transaction.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Reconciliation (e2e)', () => {
  let app: INestApplication;
  let reconciliationService: ReconciliationService;
  let accountRepo: Repository<AccountEntity>;
  let txRepo: Repository<TransactionEntity>;

  beforeAll(async () => {
    process.env.RECONCILIATION_ENABLED = 'true';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    reconciliationService = app.get<ReconciliationService>(
      ReconciliationService,
    );
    accountRepo = app.get(getRepositoryToken(AccountEntity));
    txRepo = app.get(getRepositoryToken(TransactionEntity));
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve congelar conta quando houver divergência de saldo (1 centavo)', async () => {
    // Preparar dados
    const neuralId = 'usr_recon_e2e';
    await accountRepo.delete({ neuralId });

    const account = accountRepo.create({
      neuralId,
      balanceCents: 100,
      accountNumber: '12345-6',
    });
    await accountRepo.save(account);

    const transaction = txRepo.create({
      accountId: account.id,
      amountCents: 99, // 1 centavo de diferença!
      type: 'PIX_IN',
      hash: 'mockhash',
      previousHash: 'mockprev',
      createdAt: new Date(),
    });
    await txRepo.save(transaction);

    // Executar conciliação
    await reconciliationService.runAutomatedReconciliation();

    // Validar status
    const updatedAccount = await accountRepo.findOne({
      where: { neuralId } as any,
    });
    expect(updatedAccount.status).toBe('FROZEN');
  });
});
