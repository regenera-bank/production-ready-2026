/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Notification Service Entrypoint
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/notification-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Microservice setup for RabbitMQ
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${process.env.RABBITMQ_HOST || 'localhost'}:5672`],
      queue: 'notification_queue', // This service listens on this queue
      queueOptions: {
        durable: false
      },
    },
  });

  await app.startAllMicroservices();
  // Keep the HTTP listener for potential direct calls or health checks, or remove if truly microservice only
  // If removed, start:dev script needs to change from nest start --watch -p 3006 to nest start --watch
  await app.listen(3006); 
}
bootstrap();
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
