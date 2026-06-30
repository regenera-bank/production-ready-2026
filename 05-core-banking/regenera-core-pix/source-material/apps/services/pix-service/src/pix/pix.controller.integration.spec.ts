/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: PIX Service - Integration Tests
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/pix-service/src/pix/pix.controller.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PixModule } from './pix.module';
import { AuthModule } from '../auth/auth.module';
import { PixTransaction } from './pix-transaction.entity';
import { JwtService } from '@nestjs/jwt'; // For creating test tokens

// Mock the Account Service (internal calls)
const mockAccountService = {
  patch: jest.fn(() => of({ data: { status: 'ok' } })),
};

// Mock the RabbitMQ Client
const mockRmqClient = {
  emit: jest.fn(),
  send: jest.fn(),
  connect: jest.fn(),
  close: jest.fn(),
};

describe('PixController (Integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;

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
                RABBITMQ_HOST: 'localhost',
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
            entities: [PixTransaction],
            synchronize: true, // Auto-create tables for tests
            logging: false,
          }),
        }),
        ClientsModule.register([
            {
              name: 'RMQ_TRANSACTION_CLIENT',
              transport: Transport.RMQ,
              options: {
                urls: [`amqp://localhost:5672`],
                queue: 'test_transaction_queue',
                queueOptions: {
                  durable: false
                },
              },
            },
        ]),
        PixModule,
        AuthModule, // Necessary for JwtAuthGuard
      ],
      providers: [
        // Provide mock for HttpService (used for internal calls to Account Service)
        {
          provide: HttpService,
          useValue: mockAccountService,
        },
        // Provide mock for the actual RMQ Client Proxy
        {
            provide: 'RMQ_TRANSACTION_CLIENT',
            useValue: mockRmqClient,
        }
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.connectMicroservice({
        transport: Transport.RMQ,
        options: {
            urls: [`amqp://localhost:5672`],
            queue: 'pix_test_queue', // Pix service will listen on this queue (even though it's HTTP controller)
            queueOptions: {
                durable: false
            },
        },
    });
    await app.startAllMicroservices();
    await app.init(); // Initialize the app AFTER microservices are connected
    await app.listen(3004); // Pix service usually listens on 3004

    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    // Clear the database after each test if needed
    const pixRepository = app.get(getRepositoryToken(PixTransaction));
    await pixRepository.query('TRUNCATE TABLE pix_transactions RESTART IDENTITY CASCADE;');
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const generateAccessToken = (userId: string, email: string): string => {
    return jwtService.sign({ email, sub: userId });
  };

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('POST /transfers', () => {
    const mockUserId = 'test-user-123';
    const accessToken = generateAccessToken(mockUserId, 'test@example.com');
    const sourceAccountId = 'test-acc-source';
    const destinationAccountId = 'test-acc-dest';

    it('should successfully create a PIX transfer and publish an event', async () => {
      // Mock successful debit and credit from Account Service
      mockAccountService.patch.mockResolvedValueOnce(of({ data: {} })).mockResolvedValueOnce(of({ data: {} }));

      const transferDto = {
        sourceAccountId,
        destinationAccountId,
        amountInCents: 10000, // R$ 100.00
      };

      const response = await request(app.getHttpServer())
        .post('/transfers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(transferDto)
        .expect(201); // Created

      expect(response.body).toHaveProperty('status', 'completed');
      expect(response.body).toHaveProperty('transactionId');
      expect(mockAccountService.patch).toHaveBeenCalledTimes(2); // Debit and Credit
      expect(mockRmqClient.emit).toHaveBeenCalledTimes(1);
      expect(mockRmqClient.emit).toHaveBeenCalledWith('transaction_completed', expect.objectContaining({
        userId: mockUserId,
        amountInCents: transferDto.amountInCents,
        status: 'COMPLETED',
      }));
    });

    it('should return 401 if no token is provided', async () => {
      const transferDto = {
        sourceAccountId,
        destinationAccountId,
        amountInCents: 10000,
      };

      await request(app.getHttpServer())
        .post('/transfers')
        .send(transferDto)
        .expect(401); // Unauthorized
    });

    it('should rollback (compensate) if credit fails after debit', async () => {
      // Mock successful debit, but failed credit
      mockAccountService.patch.mockResolvedValueOnce(of({ data: {} })); // Debit success
      mockAccountService.patch.mockRejectedValueOnce(new Error('Credit failed')); // Credit failure

      const transferDto = {
        sourceAccountId: 'another-source',
        destinationAccountId: 'another-dest',
        amountInCents: 5000,
      };

      const response = await request(app.getHttpServer())
        .post('/transfers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(transferDto);
      
      expect(response.status).toBe(500); // Internal Server Error due to transaction failure
      // Expect debit and a compensation credit call
      expect(mockAccountService.patch).toHaveBeenCalledTimes(3); 
      expect(mockAccountService.patch).toHaveBeenCalledWith(
        `/internal/accounts/${transferDto.sourceAccountId}/debit`, 
        { amountInCents: transferDto.amountInCents }
      );
      expect(mockAccountService.patch).toHaveBeenCalledWith(
        `/internal/accounts/${transferDto.destinationAccountId}/credit`, 
        { amountInCents: transferDto.amountInCents }
      );
      // The compensating transaction call:
      expect(mockAccountService.patch).toHaveBeenCalledWith(
        `/internal/accounts/${transferDto.sourceAccountId}/credit`, 
        { amountInCents: transferDto.amountInCents }
      );
      expect(mockRmqClient.emit).not.toHaveBeenCalled(); // Event should not be emitted on failure
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
