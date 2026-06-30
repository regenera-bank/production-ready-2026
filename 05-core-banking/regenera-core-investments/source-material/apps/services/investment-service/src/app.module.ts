/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Investment Service Root Module
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/investment-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { InvestmentModule } from './investment/investment.module';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule, AppConfigService } from '@repo/config'; // Import AppConfigModule and AppConfigService
import { TypeOrmModule } from '@nestjs/typeorm';
import { Investment, Portfolio } from './investment/investment.entity';

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
        entities: [Investment, Portfolio],
        synchronize: true, // Not for production
      }),
    }),
    InvestmentModule,
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
