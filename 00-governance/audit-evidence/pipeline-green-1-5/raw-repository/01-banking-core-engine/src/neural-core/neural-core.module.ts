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
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NeuralCoreController } from './neural-core.controller';
import { NeuralCoreService } from './neural-core.service';
import { AccountEntity } from '../core/entities/account.entity';
import { TransactionEntity } from '../core/entities/transaction.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AccountEntity, TransactionEntity]),
  ],
  controllers: [NeuralCoreController],
  providers: [NeuralCoreService],
  exports: [NeuralCoreService],
})
export class NeuralCoreModule {}
