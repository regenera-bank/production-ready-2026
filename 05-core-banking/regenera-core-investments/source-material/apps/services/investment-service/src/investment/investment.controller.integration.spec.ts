/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Investment Service - Integration Tests
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/investment-service/src/investment/investment.controller.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InvestmentModule } from './investment.module';
import { Investment, Portfolio } from './investment.entity';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('InvestmentController (Integration)', () => {
  let app: INestApplication;
  let portfolioRepository: Repository<Portfolio>;
  let investmentRepository: Repository<Investment>;
  let jwtService: JwtService;
  let testAccessToken: string;
  const testUserId = 'test-user-uuid-invest';
  const testAccountId = 'test-account-uuid-invest';

  // Mock HttpService for internal calls (e.g., to Account Service)
  const mockHttpService = {
    patch: jest.fn(() => of({ data: { status: 'debit successful' } })), // Simulate successful debit
  };

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
                ACCOUNT_SERVICE_URL: 'http://mock-account-service'
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
            entities: [Portfolio, Investment],
            synchronize: true, // Auto-create tables for tests
            logging: false,
          }),
        }),
        InvestmentModule,
      ],
      providers: [
        JwtService,
        {
            provide: HttpService,
            useValue: mockHttpService,
        }
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(3007); // Investment service usually listens on 3007

    portfolioRepository = moduleFixture.get<Repository<Portfolio>>(getRepositoryToken(Portfolio));
    investmentRepository = moduleFixture.get<Repository<Investment>>(getRepositoryToken(Investment));
    jwtService = moduleFixture.get<JwtService>(JwtService);

    testAccessToken = jwtService.sign({ email: 'test@investuser.com', sub: testUserId });
  });

  afterEach(async () => {
    await investmentRepository.query('TRUNCATE TABLE investments RESTART IDENTITY CASCADE;');
    await portfolioRepository.query('TRUNCATE TABLE portfolios RESTART IDENTITY CASCADE;');
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('POST /investments/portfolios', () => {
    it('should create a new portfolio for the authenticated user', async () => {
      const createPortfolioDto = { name: 'My Test Portfolio' };
      const response = await request(app.getHttpServer())
        .post('/investments/portfolios')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send(createPortfolioDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.name).toBe(createPortfolioDto.name);
    });
  });

  describe('GET /investments/portfolios', () => {
    it('should retrieve all portfolios for the authenticated user', async () => {
      await request(app.getHttpServer())
        .post('/investments/portfolios')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ name: 'Portfolio 1' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/investments/portfolios')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].userId).toBe(testUserId);
    });
  });

  describe('POST /investments/portfolios/:portfolioId/invest', () => {
    let portfolioId: string;

    beforeEach(async () => {
      const createPortfolioResponse = await request(app.getHttpServer())
        .post('/investments/portfolios')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ name: 'Investment Portfolio' })
        .expect(201);
      portfolioId = createPortfolioResponse.body.id;
    });

    it('should create a new investment and debit the account', async () => {
      const createInvestmentDto = { asset: 'GOOG', quantity: 5, totalAmountInCents: 500000 }; // $5000.00
      const response = await request(app.getHttpServer())
        .post(`/investments/portfolios/${portfolioId}/invest`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ ...createInvestmentDto, accountId: testAccountId })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.asset).toBe(createInvestmentDto.asset);
      expect(response.body.quantity).toBe(createInvestmentDto.quantity);
      expect(mockHttpService.patch).toHaveBeenCalledWith(
        `http://mock-account-service/internal/accounts/${testAccountId}/debit`,
        { amountInCents: createInvestmentDto.totalAmountInCents }
      );
    });

    it('should return 404 if portfolio not found', async () => {
      const createInvestmentDto = { asset: 'GOOG', quantity: 5, totalAmountInCents: 500000 };
      await request(app.getHttpServer())
        .post(`/investments/portfolios/nonexistent-portfolio/invest`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ ...createInvestmentDto, accountId: testAccountId })
        .expect(404);
    });

    it('should return 500 if debiting account fails', async () => {
      mockHttpService.patch.mockReturnValueOnce(of({})); // Reset mock
      mockHttpService.patch.mockReturnValueOnce(throwError(() => new Error('Debit failed'))); // Simulate debit failure

      const createInvestmentDto = { asset: 'GOOG', quantity: 5, totalAmountInCents: 500000 };
      const response = await request(app.getHttpServer())
        .post(`/investments/portfolios/${portfolioId}/invest`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ ...createInvestmentDto, accountId: testAccountId });

      expect(response.status).toBe(500); // InternalServerErrorException
      expect(response.body.message).toContain('Failed to process payment for investment.');
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
