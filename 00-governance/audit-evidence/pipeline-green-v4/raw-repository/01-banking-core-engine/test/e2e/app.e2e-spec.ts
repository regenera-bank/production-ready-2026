import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Aumenta o tempo limite caso a inicialização demore (como VertexAI deprecation hooks, etc)
    jest.setTimeout(30000);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('UP');
      });
  });

  it('/metrics (GET)', () => {
    return request(app.getHttpServer())
      .get('/metrics')
      .expect(200)
      .expect('Content-Type', /text\/plain/)
      .expect((res) => {
        expect(res.text).toContain('pix_requests_total');
        expect(res.text).toContain('ledger_debit_total');
        expect(res.text).toContain('ledger_credit_total');
        expect(res.text).toContain('outbox_pending_total');
      });
  });
});
