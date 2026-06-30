/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - PIX SERVICE
  Module: Application Main

  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky

  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Aqui entrariam as configurações globais do serviço (CORS, Helmet, etc.),
  // similar ao que foi feito no core-banking (auth-service).
  await app.listen(3002); // Porta diferente para o novo serviço
  console.log('Pix Service is running on port 3002');
}
bootstrap();
