/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Transaction Service Root Module
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/transaction-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { TransactionModule } from './transaction/transaction.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule, AppConfigService } from '@repo/config'; // Import AppConfigModule and AppConfigService
import { Transaction } from './transaction/transaction.entity';

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
        entities: [Transaction],
        synchronize: true, // Not for production
      }),
    }),
    TransactionModule,
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
