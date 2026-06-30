/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Card Service - Integration Tests
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/card-service/src/card/card.controller.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CardModule } from './card.module';
import { Card, CardStatus } from './card.entity';

describe('CardController (Integration)', () => {
  let app: INestApplication;
  let cardRepository: Repository<Card>;
  let jwtService: JwtService;
  let testAccessToken: string;
  const testUserId = 'test-user-uuid-card';

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
            entities: [Card],
            synchronize: true, // Auto-create tables for tests
            logging: false,
          }),
        }),
        CardModule,
      ],
      providers: [
        JwtService, 
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(3005); // Card service usually listens on 3005

    cardRepository = moduleFixture.get<Repository<Card>>(getRepositoryToken(Card));
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Generate a valid test token for a mock user
    testAccessToken = jwtService.sign({ email: 'test@carduser.com', sub: testUserId });
  });

  afterEach(async () => {
    await cardRepository.query('TRUNCATE TABLE cards RESTART IDENTITY CASCADE;');
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(cardRepository).toBeDefined();
  });

  describe('POST /cards', () => {
    it('should create a new card for the authenticated user', async () => {
      const createCardDto = { userId: testUserId, type: 'Credit', issuer: 'RegeneraBank' };
      const response = await request(app.getHttpServer())
        .post('/cards')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send(createCardDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.type).toBe('Credit');
      expect(response.body).toHaveProperty('cardNumber'); // Auto-generated
    });

    it('should return 401 if no token is provided', async () => {
      await request(app.getHttpServer())
        .post('/cards')
        .send({ userId: testUserId, type: 'Credit', issuer: 'RegeneraBank' })
        .expect(401);
    });
  });

  describe('GET /cards', () => {
    it('should retrieve all cards for the authenticated user', async () => {
      // Create a card first
      await request(app.getHttpServer())
        .post('/cards')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ userId: testUserId, type: 'Debit', issuer: 'RegeneraBank' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/cards')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].userId).toBe(testUserId);
    });

    it('should return an empty array if no cards are found for the user', async () => {
      const response = await request(app.getHttpServer())
        .get('/cards')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('PATCH /cards/:id/status', () => {
    let createdCardId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/cards')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ userId: testUserId, type: 'Credit', issuer: 'RegeneraBank' })
        .expect(201);
      createdCardId = createResponse.body.id;
    });

    it('should update the status of a card', async () => {
      const updateDto = { status: CardStatus.BLOCKED };
      const response = await request(app.getHttpServer())
        .patch(`/cards/${createdCardId}/status`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.id).toBe(createdCardId);
      expect(response.body.status).toBe(CardStatus.BLOCKED);
    });

    it('should return 404 if the card ID does not exist for the user', async () => {
      const updateDto = { status: CardStatus.BLOCKED };
      await request(app.getHttpServer())
        .patch(`/cards/nonexistent-card-id/status`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send(updateDto)
        .expect(404);
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
