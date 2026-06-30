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

// |---------------------------------------------------------------------------------------|
// |  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
// |---------------------------------------------------------------------------------------|
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';
import { PixController } from './pix.controller';
import { PixService } from './pix.service';
import { PixEventsGateway } from './pix.gateway';
import { IdempotencyService } from './idempotency.service';
import { AuthModule } from '../auth/auth.module';
import { AccountEntity } from './entities/account.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { UserEntity } from './entities/user.entity';
import { PixKeyEntity } from './entities/pix-key.entity';
import { IdempotencyLogEntity } from './entities/idempotency-log.entity';
import { OutboxEventEntity } from './entities/outbox-event.entity';

import { InfraModule } from '../infra/infra.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => InfraModule),
    TypeOrmModule.forFeature([
      UserEntity,
      AccountEntity,
      TransactionEntity,
      PixKeyEntity,
      IdempotencyLogEntity,
      OutboxEventEntity,
    ]),
  ],
  controllers: [CoreController, PixController],
  providers: [CoreService, PixService, PixEventsGateway, IdempotencyService],
  exports: [CoreService, PixService, PixEventsGateway, IdempotencyService],
})
export class CoreModule {}
