/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: PIX Service Entrypoint
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/pix-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AppLoggerService } from '@repo/logging'; // Importar AppLoggerService
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'; // Importar o filtro

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Adicionado bufferLogs para usar AppLoggerService
  });

  app.useLogger(app.get(AppLoggerService)); // Usar custom AppLoggerService

  // Aplica o filtro de exceções globalmente.
  // CRÍTICO: Garante respostas de erro consistentes e segurança na exposição de detalhes internos.
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  // This service runs on port 3004, as expected by the API Gateway.
  await app.listen(3004);
}
bootstrap();
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
