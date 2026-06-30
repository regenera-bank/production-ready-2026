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
import { InfraController } from './infra.controller';
import { InfraService } from './infra.service';
import { TracingService } from './tracing/tracing.service';
import { BackupService } from './disaster-recovery/backup.service';
import { RestoreService } from './disaster-recovery/restore.service';

@Module({
  controllers: [InfraController],
  providers: [InfraService, TracingService, BackupService, RestoreService],
  exports: [InfraService, TracingService, BackupService, RestoreService],
})
export class InfraModule {}
