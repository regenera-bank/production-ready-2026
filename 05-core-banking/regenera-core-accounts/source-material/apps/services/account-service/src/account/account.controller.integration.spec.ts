/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Account Service - Integration Tests
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/account-service/src/account/account.controller.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountModule } from './account.module';
import { Account } from './account.entity';
import { Money } from '@repo/core'; // Assuming Money Value Object

// Mock the AuthModule to avoid real gRPC calls and simplify token generation
class MockAuthService {
  async validateUser(email: string, pass: string): Promise<any> {
    if (email === 'test@user.com' && pass === 'password') {
      return { userId: 'mock-user-id', email: 'test@user.com', fullName: 'Test User' };
    }
    return null;
  }
  async login(email: string, pass: string) {
    const user = await this.validateUser(email, pass);
    if (user) {
      return { access_token: 'mock-jwt-token' };
    }
    return null;
  }
}

describe('AccountController (Integration)', () => {
  let app: INestApplication;
  let accountRepository: Repository<Account>;
  let jwtService: JwtService;
  let testAccessToken: string;
  const testUserId = 'test-user-uuid';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
                DATABASE_HOST: 'localhost',
                DATABASE_PORT: 5432,
                DATABASE_USER: 'regenera_user',
                DATABASE_PASSWORD: 'regenera_password',
                DATABASE_NAME: 'regenera_bank_test', // Use a separate test database
                JWT_SECRET: 'TEST_JWT_SECRET',
            })],
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (cfg: ConfigService) => ({
            type: 'postgres',
            host: cfg.get<string>('DATABASE_HOST'),
            port: cfg.get<number>('DATABASE_PORT'),
            username: cfg.get<string>('DATABASE_USER'),
            password: cfg.get<string>('DATABASE_PASSWORD'),
            database: cfg.get<string>('DATABASE_NAME'),
            entities: [Account],
            synchronize: true, // Auto-create tables for tests
            logging: false,
          }),
        }),
        AccountModule,
      ],
      providers: [
        // Override real JwtService to sign test tokens
        JwtService, 
        // We might need to mock auth-service dependencies if a real auth-service is not running
        // For simplicity, we assume JwtStrategy can decode a test token signed by the mock JwtService
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(3003); // Account service usually listens on 3003

    accountRepository = moduleFixture.get<Repository<Account>>(getRepositoryToken(Account));
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Generate a valid test token for a mock user
    testAccessToken = jwtService.sign({ email: 'test@user.com', sub: testUserId });
  });

  afterEach(async () => {
    // Clean up accounts created during tests
    await accountRepository.query('TRUNCATE TABLE accounts RESTART IDENTITY CASCADE;');
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(accountRepository).toBeDefined();
  });

  describe('POST /accounts', () => {
    it('should create a new account for a user', async () => {
      const createAccountDto = { userId: testUserId };
      const response = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send(createAccountDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.balance).toBe(100000); // Default initial balance
    });

    it('should not create an account if one already exists for the user', async () => {
      // First create the account
      await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ userId: testUserId })
        .expect(201);
      
      // Attempt to create again
      await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ userId: testUserId })
        .expect(409); // Conflict
    });
  });

  describe('GET /accounts', () => {
    it('should retrieve the account for the authenticated user', async () => {
      // Create an account first
      await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ userId: testUserId })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(testUserId);
    });

    it('should return 404 if no account exists for the user', async () => {
      await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /internal/accounts/:id/credit', () => {
    let createdAccountId: string;

    beforeEach(async () => {
      // Ensure an account exists for internal operations
      const createResponse = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ userId: testUserId });
      createdAccountId = createResponse.body.id;
    });

    it('should credit an account', async () => {
      const creditAmount = { amount: Money.fromCents(5000) }; // R$ 50.00
      const initialAccount = await accountRepository.findOneBy({ id: createdAccountId });
      const initialBalance = initialAccount.balance.getAmountInCents();

      const response = await request(app.getHttpServer())
        .patch(`/internal/accounts/${createdAccountId}/credit`)
        .send({ amountInCents: creditAmount.amount.getAmountInCents() })
        // Internal endpoints don't need JWT in this setup, but in real life, they'd have internal protection.
        .expect(200);

      expect(response.body.balance).toBe(initialBalance + creditAmount.amount.getAmountInCents());
    });
  });

  describe('PATCH /internal/accounts/:id/debit', () => {
    let createdAccountId: string;

    beforeEach(async () => {
      // Ensure an account exists with sufficient funds
      const createResponse = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ userId: testUserId });
      createdAccountId = createResponse.body.id;

      // Manually add funds to avoid initial zero balance issues for debit test
      const account = await accountRepository.findOneBy({ id: createdAccountId });
      account.balance = account.balance.add(Money.fromCents(1000000)); // R$ 10,000.00
      await accountRepository.save(account);
    });

    it('should debit an account', async () => {
      const debitAmount = { amount: Money.fromCents(5000) };
      const initialAccount = await accountRepository.findOneBy({ id: createdAccountId });
      const initialBalance = initialAccount.balance.getAmountInCents();

      const response = await request(app.getHttpServer())
        .patch(`/internal/accounts/${createdAccountId}/debit`)
        .send({ amountInCents: debitAmount.amount.getAmountInCents() })
        .expect(200);

      expect(response.body.balance).toBe(initialBalance - debitAmount.amount.getAmountInCents());
    });

    it('should return 409 (Conflict) for insufficient funds', async () => {
      // Debit more than available
      const debitAmount = { amount: Money.fromCents(2000000) }; // Try to debit R$ 20,000.00 from R$ 10,000.00
      await request(app.getHttpServer())
        .patch(`/internal/accounts/${createdAccountId}/debit`)
        .send({ amountInCents: debitAmount.amount.getAmountInCents() })
        .expect(409); // Conflict (Insufficient Funds)
    });
  });
});
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
