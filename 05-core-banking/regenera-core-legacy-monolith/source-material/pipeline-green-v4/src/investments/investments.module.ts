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

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';
import { TradingGateway } from './trading.gateway';
import { AuthModule } from '../auth/auth.module';
import { CoreModule } from '../core/core.module';
import { InvestmentEntity } from './entities/investment.entity';

@Module({
  imports: [
    AuthModule,
    CoreModule,
    TypeOrmModule.forFeature([InvestmentEntity]),
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService, TradingGateway],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
