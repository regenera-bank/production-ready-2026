/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: End-to-End Tests

  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky

  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] app.e2e-spec.ts

// // DEV NOTE: `@nestjs/testing`, `supertest` são dependências de desenvolvimento.
// // Adicionar ao package.json: `npm i -D @nestjs/testing supertest jest @types/jest`
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../apps/services/core-banking/src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  // Setup do ambiente de teste antes de rodar os casos.
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Emula a configuração de pipes globais do main.ts
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true
    }));
    await app.init();
  });

  // [TESTS] Teste E2E para o fluxo de consentimento LGPD
  describe('/lgpd/consent (POST)', () => {
    it('should record user consent and return a success status', () => {
      const consentPayload = {
        userId: 'user-e2e-test-123',
        hasConsented: true,
        termsVersion: 'v1.0.0',
        // IP e User-Agent são injetados pelo controller, não precisa mandar.
      };

      return request(app.getHttpServer())
        .post('/lgpd/consent')
        .send(consentPayload)
        .expect(201) // HTTP 201 Created
        .expect(res => {
          expect(res.body).toHaveProperty('status', 'Consent recorded successfully');
          expect(res.body).toHaveProperty('recordId');
          expect(res.body.recordId).toContain('consent_user-e2e-test-123');
        });
    });

    it('should fail if the payload is invalid (e.g., missing userId)', () => {
        const invalidPayload = {
            hasConsented: true,
            termsVersion: 'v1.0.0',
        };

        return request(app.getHttpServer())
            .post('/lgpd/consent')
            .send(invalidPayload)
            .expect(400); // HTTP 400 Bad Request
    });
  });

  // Teardown do app para limpar os recursos.
  afterAll(async () => {
    await app.close();
  });
});
