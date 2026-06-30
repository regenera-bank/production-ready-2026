/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Analytics Service Root Module
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/analytics-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics/analytics.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigModule, AppConfigService } from '@repo/config'; // Import AppConfigModule and AppConfigService

@Module({
  imports: [
    AppConfigModule, // Use our centralized config module
    MongooseModule.forRootAsync({
      imports: [AppConfigModule], // Make AppConfigService available
      inject: [AppConfigService],
      useFactory: async (configService: AppConfigService) => ({
        uri: configService.getMongoUri(),
      }),
    }),
    AnalyticsModule,
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
