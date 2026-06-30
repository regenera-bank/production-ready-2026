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
 * @file app.module.ts
 * @description Root application module — wires together all feature modules
 *
 * @author    Paulo Ricardo de Leão  <paulo@regenerabank.app>
 * @id        RG-2098233287
 * @maintainer Raphaela Cerveski    <ceo@regenerabank.app>
 * @copyright 2026 Regenera Corporate Ltd. — All rights reserved.
 * @license   UNLICENSED
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CoreModule } from './core/core.module';
import { NeuralModule } from './neural/neural.module';
import { InvestmentsModule } from './investments/investments.module';
import { LifestyleModule } from './lifestyle/lifestyle.module';
import { ComplianceModule } from './compliance/compliance.module';
import { OpenFinanceModule } from './open-finance/open-finance.module';
import { NeuralCoreModule } from './neural-core/neural-core.module';
import { InfraModule } from './infra/infra.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { HealthController } from './health.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule } from './metrics/metrics.module';
import { TenantModule } from './common/tenant/tenant.module';
import { EcosystemModule } from './ecosystem/ecosystem.module';
import { DeveloperPortalModule } from './developer-portal/developer-portal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): any => {
        return {
          type: process.env.NODE_ENV === 'test' ? 'sqlite' : 'postgres',
          url:
            process.env.NODE_ENV === 'test'
              ? undefined
              : config.getOrThrow<string>('DATABASE_URL'),
          database: process.env.NODE_ENV === 'test' ? ':memory:' : undefined,
          ssl: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
          },
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV === 'test', // Prod ledger: tables must be created via migrations or pre-seeded structure, not auto sync
          logging: ['error', 'warn'],
        };
      },
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_NEURAL_SECRET'),
        signOptions: { expiresIn: '8h', issuer: 'regenera-bank' },
      }),
    }),
    AuthModule,
    CoreModule,
    NeuralModule,
    InvestmentsModule,
    LifestyleModule,
    ComplianceModule,
    OpenFinanceModule,
    NeuralCoreModule,
    InfraModule,
    ReconciliationModule,
    MetricsModule,
    TenantModule,
    EcosystemModule,
    DeveloperPortalModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
