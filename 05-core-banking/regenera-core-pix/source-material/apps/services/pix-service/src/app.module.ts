/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: PIX Service Root Module
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/pix-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { PixModule } from './pix/pix.module';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule, AppConfigService } from '@repo/config'; // Import AppConfigModule and AppConfigService
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixTransaction } from './pix/pix-transaction.entity';

@Module({
  imports: [
    AppConfigModule, // Use our centralized config module
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule], // Make AppConfigService available
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        type: 'postgres',
        host: configService.getDatabaseHost(),
        port: configService.getDatabasePort(),
        username: configService.getDatabaseUser(),
        password: configService.getDatabasePassword(),
        database: configService.getDatabaseName(),
        entities: [PixTransaction],
        synchronize: true, // Not for production
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: 'RMQ_TRANSACTION_CLIENT',
        imports: [AppConfigModule], // Use our centralized config module
        useFactory: (configService: AppConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [`amqp://${configService.getRabbitMQHost()}:5672`],
            queue: 'transaction_queue',
            queueOptions: {
              durable: false
            },
          },
        }),
        inject: [AppConfigService],
      },
    ]),
    PixModule,
    AuthModule,
  ],
})
export class AppModule {}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
