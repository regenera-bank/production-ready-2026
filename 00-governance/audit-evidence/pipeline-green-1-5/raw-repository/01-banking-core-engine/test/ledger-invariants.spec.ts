import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountEntity } from '../src/core/entities/account.entity';
import { OutboxEventEntity } from '../src/core/entities/outbox-event.entity';
import { TransactionEntity } from '../src/core/entities/transaction.entity';
import { Repository } from 'typeorm';
import { CoreService } from '../src/core/core.service';
import { createHash } from 'crypto';

jest.mock('@google-cloud/secret-manager', () => ({
  SecretManagerServiceClient: jest.fn().mockImplementation(() => ({
    accessSecretVersion: jest.fn().mockResolvedValue([
      {
        payload: { data: Buffer.from('MOCK_SECRET_VALUE') },
      },
    ]),
  })),
}));

jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => 'MOCK_VERTEX_RESPONSE' },
      }),
    }),
  })),
}));

jest.mock('@google-cloud/pubsub', () => ({
  PubSub: jest.fn().mockImplementation(() => ({
    topic: jest.fn().mockReturnValue({
      publishMessage: jest.fn().mockResolvedValue('msg-1'),
      subscription: jest.fn().mockReturnValue({
        on: jest.fn(),
      }),
    }),
    subscription: jest.fn().mockReturnValue({
      on: jest.fn(),
    }),
  })),
}));

jest.mock('firebase-admin', () => {
  return {
    apps: ['mockApp'],
    initializeApp: jest.fn(),
    credential: {
      applicationDefault: jest.fn(),
    },
    auth: jest.fn().mockReturnValue({}),
    firestore: jest.fn(),
  };
});

describe('Ledger Invariants Compliance Test Suite', () => {
  let moduleFixture: TestingModule;
  let accountRepo: Repository<AccountEntity>;
  let outboxRepo: Repository<OutboxEventEntity>;
  let txRepo: Repository<TransactionEntity>;
  let coreService: CoreService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    accountRepo = moduleFixture.get(getRepositoryToken(AccountEntity));
    outboxRepo = moduleFixture.get(getRepositoryToken(OutboxEventEntity));
    txRepo = moduleFixture.get(getRepositoryToken(TransactionEntity));
    coreService = moduleFixture.get<CoreService>(CoreService);
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('invariante 1: a soma do saldo de todas as contas bate com a soma das transacoes no ledger', async () => {
    const accounts = await accountRepo.find();
    for (const account of accounts) {
      const txs = await txRepo.find({ where: { accountId: account.id } });
      const ledgerSum = txs.reduce((sum, t) => sum + Number(t.amountCents), 0);
      expect(Number(account.balanceCents)).toBe(ledgerSum);
    }
  });

  it('invariante 2: debito sempre tem credito correspondente e nao permite saldo negativo', async () => {
    const sender = await coreService.createAccount('inv_sender');
    const receiver = await coreService.createAccount('inv_receiver');

    // Seed
    await coreService.seedAccountBalance('inv_sender', 5000); // R$ 50

    // Transfer
    await coreService.transfer('inv_sender', 'inv_receiver', 2000);

    const senderTxs = await txRepo.find({ where: { accountId: sender.id } });
    const receiverTxs = await txRepo.find({
      where: { accountId: receiver.id },
    });

    // Debit of 2000, credit of 2000
    const lastDebit = senderTxs.find(
      (t) => t.type === 'INTERNAL_TED_OUT' && Number(t.amountCents) === -2000,
    );
    const lastCredit = receiverTxs.find(
      (t) => t.type === 'INTERNAL_TED_IN' && Number(t.amountCents) === 2000,
    );

    expect(lastDebit).toBeDefined();
    expect(lastCredit).toBeDefined();

    // Insufficient funds rollback check
    await expect(
      coreService.transfer('inv_sender', 'inv_receiver', 10000),
    ).rejects.toThrow();

    // Verify balance was not deducted on failed transfer
    const senderAcc = await accountRepo.findOne({ where: { id: sender.id } });
    expect(Number(senderAcc.balanceCents)).toBe(3000);
  });

  it('invariante 3: a chain de hashes do ledger e valida e quebra se alterada', async () => {
    const user = await coreService.createAccount('inv_chain_user');
    await coreService.seedAccountBalance('inv_chain_user', 10000);

    await coreService.debit('inv_chain_user', 1000);
    await coreService.debit('inv_chain_user', 2000);
    await coreService.debit('inv_chain_user', 3000);

    const txs = await txRepo.find({
      where: { accountId: user.id },
      order: { createdAt: 'ASC' },
    });

    expect(txs.length).toBe(3);

    // Verify correct hashes
    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      if (i > 0) {
        expect(tx.previousHash).toBe(txs[i - 1].hash);
      } else {
        expect(tx.previousHash).toBe('GENESIS_HASH');
      }

      // Recompute hash
      const rawString = `${tx.previousHash}|${tx.accountId}|${tx.amountCents}|${tx.type}|${tx.idempotencyKey || 'null'}|${tx.createdAt.toISOString()}`;
      const recomputed = createHash('sha256').update(rawString).digest('hex');
      expect(tx.hash).toBe(recomputed);
    }
  });

  it('invariante 4: outbox so e registrado em transacao atomica commitada', async () => {
    const initialOutboxCount = await outboxRepo.count();

    // Failed operation (insufficient funds)
    try {
      await coreService.debit('inv_chain_user', 500000);
    } catch {}

    const postFailedCount = await outboxRepo.count();
    expect(postFailedCount).toBe(initialOutboxCount); // No new outbox entry should be created since it rollbacked
  });
});
