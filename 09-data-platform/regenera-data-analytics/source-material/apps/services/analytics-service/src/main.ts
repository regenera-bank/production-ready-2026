/**
 * @.config/gcloud/virtenv/lib/python3.13/site-packages/cffi-2.0.0.dist-info/licenses/AUTHORS Don Paulo Ricardo de Leão
 * @orcid https://orcid.org/0009-0002-1934-3559
 * @Library/pnpm/store/v10/index/d6/90ba37ca9625b5a83ed12381c2f6c7285038fe3dd44423794a37a9329c995f-is-finalizationregistry@1.1.1.json 2098233287
 * @Library/pnpm/store/v10/index/e8/137db6b1fb6e9deabe7ad1cb3b01cfe837959c533594db54ed84575092d162-finalhandler@1.3.1.json @don.pauloricardo
 * @Desktop/Start/MACBOOK/START/BBEdit.app/Contents/Resources/BBEdit.help/Contents/Resources/en.lproj/copyright.htm 2025 Regenera Corporation
 * @proprietary Código original, auditado e protegido.
 */

// [FILE] apps/services/analytics-service/src/main.ts
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
      queue: 'analytics_queue', // This service listens on this queue
      queueOptions: {
        durable: false
      },
    },
  });

  await app.startAllMicroservices();
  // Don Paulo: Manter HTTP para health checks ou remover se o serviço for puramente microserviço.
  await app.listen(3008); 
}
bootstrap();
