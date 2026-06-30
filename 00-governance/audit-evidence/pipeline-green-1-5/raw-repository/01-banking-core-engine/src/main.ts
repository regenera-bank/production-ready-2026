/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

/**
 * @file main.ts
 * @description Application bootstrap — Regenera Bank Core API
 *
 * @author    Paulo Ricardo de Leão  <paulo@regenerabank.app>
 * @id        RG-2098233287
 * @maintainer Raphaela Cerveski    <ceo@regenerabank.app>
 * @copyright 2026 Regenera Corporate Ltd. — All rights reserved.
 * @license   UNLICENSED
 *
 * @version 4.0.0
 * @since   2026-01-01
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Added for full OpenAPI per Guia RTF + ações imediatas (orval + contract tests)
import helmet from 'helmet';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    rawBody: true,
  });

  app.use(helmet());

  // CORS must explicitly list every custom header the frontend wretch client sends on requests.
  // See src/core/api/client.ts middleware:
  //   - Idempotency-Key is added for *every* mutation (POST/PUT/PATCH/DELETE) — this was the one
  //     causing the preflight error "idempotency-key is not allowed by Access-Control-Allow-Headers".
  //   - X-Trace-Id, X-Neural-Sync-ID, X-Client-Version are sent on all calls for tracing/audit.
  // Origin list must include the Vercel prod + common local dev ports.
  app.enableCors({
    origin: [
      'https://regenera-bank-enterprise.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Trace-Id',
      'X-Neural-Sync-ID',
      'X-Client-Version',
      'Idempotency-Key',
    ],
    credentials: true,
  });

  // TODO: migrar para o api versioning nativo do nestjs no proximo ciclo (a gnt ta forçando 'v1' na mao)
  app.setGlobalPrefix('v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger / OpenAPI full (Guia RTF exact schemas + orval ready + "rode orval")
  // UI: /v1/api-docs
  // JSON for orval (and e2e/contract tests): /v1/api-docs-json
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Regenera Bank v4 API')
    .setDescription(
      'Plataforma bancária com Open Finance (Prometeo), IA Raphaela (Gemini), PIX idempotente, liveness step-up, Cloud Run Admin, ledger ACID. Contratos exatos do Guia RTF.',
    )
    .setVersion('4.0.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: 'Idempotency-Key', in: 'header' },
      'Idempotency-Key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);
  // Expose raw JSON for orval / external consumers (no auth for spec)
  app.use('/v1/api-docs-json', (_req: any, res: any, next: any) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).send({ error: 'Swagger disabled in production' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port, '0.0.0.0');
  logger.log(
    `Regenera Bank Core API running on :${port} [${process.env.NODE_ENV ?? 'development'}]`,
  );

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.warn('SIGTERM received — shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.warn('SIGINT received — shutting down gracefully');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal error during bootstrap', err);
  process.exit(1);
});
