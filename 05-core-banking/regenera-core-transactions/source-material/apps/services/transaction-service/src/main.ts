/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Transaction Service Entrypoint
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/transaction-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Connect microservice for RabbitMQ events
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${process.env.RABBITMQ_HOST || 'localhost'}:5672`],
      queue: 'transaction_settlement_queue', // This service listens on this queue
      queueOptions: {
        durable: false
      },
    },
  });

  await app.startAllMicroservices();
  // Optionally, keep an HTTP listener for health checks or direct API calls.
  // For a pure event-driven service, this might be removed.
  await app.listen(3012); 
}
bootstrap();
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
