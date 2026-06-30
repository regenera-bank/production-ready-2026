import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountEntity } from '../../src/core/entities/account.entity';
import { OutboxEventEntity } from '../../src/core/entities/outbox-event.entity';
import { TransactionEntity } from '../../src/core/entities/transaction.entity';
import { Repository } from 'typeorm';
import { ReconciliationService } from '../../src/reconciliation/reconciliation.service';
import { JwtService } from '@nestjs/jwt';

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
  const mockAuth = {
    createUser: jest.fn().mockImplementation(async (dto) => ({
      uid: 'usr_e2e_test_register',
      email: dto.email,
      displayName: dto.displayName,
    })),
    getUserByEmail: jest.fn().mockImplementation(async (email) => {
      return { uid: 'usr_e2e_test_auth', email, displayName: 'E2E User' };
    }),
    verifyIdToken: jest.fn().mockImplementation(async (t) => {
      if (t === 'mock-id-token') {
        return { uid: 'usr_e2e_test_auth', email: 'test@example.com' };
      }
      throw new Error('Not firebase token');
    }),
    getUser: jest.fn().mockResolvedValue({
      uid: 'usr_e2e_test_auth',
      email: 'test@example.com',
      customClaims: { role: 'user' },
    }),
  };
  return {
    apps: ['mockApp'],
    initializeApp: jest.fn(),
    credential: {
      applicationDefault: jest.fn(),
    },
    auth: jest.fn().mockReturnValue(mockAuth),
    firestore: jest.fn().mockReturnValue({
      runTransaction: jest.fn(async (cb) =>
        cb({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({ currentCents: 1000, targetCents: 50000 }),
          }),
          update: jest.fn(),
        }),
      ),
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ currentCents: 1000, targetCents: 50000 }),
        }),
      }),
    }),
  };
});

jest.mock('@google-cloud/vision', () => ({
  ImageAnnotatorClient: jest.fn().mockImplementation(() => ({
    faceDetection: jest.fn().mockResolvedValue([
      {
        faceAnnotations: [
          {
            detectionConfidence: 0.95,
            blurredLikelihood: 'VERY_UNLIKELY',
          },
        ],
      },
    ]),
  })),
}));

describe('Bank Ledger & Settlement Core (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let accountRepo: Repository<AccountEntity>;
  let outboxRepo: Repository<OutboxEventEntity>;
  let txRepo: Repository<TransactionEntity>;
  let reconciliationService: ReconciliationService;
  let token: string;
  const senderNeuralId = 'usr_sender_e2e_ledger';
  const receiverNeuralId = 'usr_receiver_e2e_ledger';

  beforeAll(async () => {
    // Mock fetch for server-side IdentityToolkit validation in login
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        idToken: 'mock-id-token',
        email: 'test@example.com',
        localId: 'usr_e2e_test_auth',
      }),
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    jwtService = app.get<JwtService>(JwtService);
    accountRepo = app.get(getRepositoryToken(AccountEntity));
    outboxRepo = app.get(getRepositoryToken(OutboxEventEntity));
    txRepo = app.get(getRepositoryToken(TransactionEntity));
    reconciliationService = app.get<ReconciliationService>(
      ReconciliationService,
    );

    // Seed test accounts
    await accountRepo.delete({ neuralId: senderNeuralId });
    await accountRepo.delete({ neuralId: receiverNeuralId });
    await accountRepo.delete({ neuralId: 'usr_e2e_test_auth' });

    await accountRepo.save(
      accountRepo.create({
        neuralId: senderNeuralId,
        balanceCents: 5000,
        accountNumber: 'acc-sender-e2e',
        agency: '0001',
      }),
    );
    await accountRepo.save(
      accountRepo.create({
        neuralId: receiverNeuralId,
        balanceCents: 0,
        accountNumber: 'acc-receiver-e2e',
        agency: '0001',
      }),
    );
    await accountRepo.save(
      accountRepo.create({
        neuralId: 'usr_e2e_test_auth',
        balanceCents: 10000,
        accountNumber: 'acc-auth-e2e',
        agency: '0001',
      }),
    );

    token = jwtService.sign({
      sub: senderNeuralId,
      neuralId: senderNeuralId,
      role: 'user',
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/health (GET) - health check', async () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.status).toBe('UP');
      });
  });

  it('/auth/register (POST) - account creation & registration', async () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'New E2E User',
        email: 'new_e2e@example.com',
        password: 'password123',
      })
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user.email).toBe('new_e2e@example.com');
        expect(res.body.user.account).toBeDefined();
      });
  });

  it('/auth/login (POST) - authentication check', async () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user.email).toBe('test@example.com');
      });
  });

  it('/pix/transfer (POST) - outbound transfer, duplicate, insufficient funds, outbox creation', async () => {
    const idempotencyKey = 'idem-key-e2e-ledger';

    // 1. Success Outbound Transfer
    await request(app.getHttpServer())
      .post('/pix/transfer')
      .set('Authorization', `Bearer ${token}`)
      .set('idempotency-key', idempotencyKey)
      .send({
        key: 'receiver@example.com',
        amount: 15, // R$ 15,00
      })
      .expect(HttpStatus.CREATED);

    // Verify Sender Balance debited by 1500 cents (5000 -> 3500)
    let sender = await accountRepo.findOne({
      where: { neuralId: senderNeuralId },
    });
    expect(Number(sender.balanceCents)).toBe(3500);

    // Verify Transactional Outbox Event created
    const outboxEvents = await outboxRepo.find({ order: { id: 'DESC' } });
    expect(outboxEvents.length).toBeGreaterThan(0);
    expect(outboxEvents[0].topic).toBe('ledger.transaction.settled');
    expect(outboxEvents[0].payload.amountCents).toBe(-1500);

    // 2. Duplicate Pix (idempotency key protection)
    await request(app.getHttpServer())
      .post('/pix/transfer')
      .set('Authorization', `Bearer ${token}`)
      .set('idempotency-key', idempotencyKey)
      .send({
        key: 'receiver@example.com',
        amount: 15,
      })
      .expect(HttpStatus.OK); // idempotent request returns 200

    // Verify Sender Balance remains 3500 cents (no second debit)
    sender = await accountRepo.findOne({ where: { neuralId: senderNeuralId } });
    expect(Number(sender.balanceCents)).toBe(3500);

    // 3. Insufficient Funds Rollback
    await request(app.getHttpServer())
      .post('/pix/transfer')
      .set('Authorization', `Bearer ${token}`)
      .set('idempotency-key', 'idem-key-insufficient')
      .send({
        key: 'receiver@example.com',
        amount: 50, // R$ 50,00 (sender only has R$ 35,00)
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('Reconciliation and Frozen Account block check', async () => {
    const mismatchedNeuralId = 'usr_reconciliation_mismatch_e2e';
    await accountRepo.delete({ neuralId: mismatchedNeuralId });

    // Seed mismatched account: balance is 100 cents, transaction has 50 cents
    const account = await accountRepo.save(
      accountRepo.create({
        neuralId: mismatchedNeuralId,
        balanceCents: 100,
        accountNumber: 'mismatch-acc-number',
        agency: '0001',
      }),
    );

    await txRepo.save(
      txRepo.create({
        accountId: account.id,
        amountCents: 50, // Mismatch (100 vs 50)
        type: 'PIX_IN',
        hash: 'e2ehash',
        previousHash: 'genesis',
        createdAt: new Date(),
      }),
    );

    // Run reconciliation - must freeze mismatched account
    await reconciliationService.runAutomatedReconciliation();

    const frozenAccount = await accountRepo.findOne({
      where: { neuralId: mismatchedNeuralId },
    });
    expect(frozenAccount.status).toBe('FROZEN');

    // Attempt transfer on frozen account
    const frozenToken = jwtService.sign({
      sub: mismatchedNeuralId,
      neuralId: mismatchedNeuralId,
      role: 'user',
    });

    await request(app.getHttpServer())
      .post('/pix/transfer')
      .set('Authorization', `Bearer ${frozenToken}`)
      .set('idempotency-key', 'idem-frozen-test')
      .send({
        key: 'receiver@example.com',
        amount: 1,
      })
      .expect(HttpStatus.FORBIDDEN)
      .expect((res) => {
        expect(res.body.message).toContain('irregular');
      });
  });
});
