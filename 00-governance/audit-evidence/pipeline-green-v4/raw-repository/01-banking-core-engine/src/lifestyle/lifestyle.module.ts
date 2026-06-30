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
//
// PROJECT:       Regenera Bank
// CEO:           Raphaela Cerveski
// DEVELOPER:     Don Paulo Ricardo
// ID:            2098233287
// COPYRIGHT:     Copyright (c) 2026 Regenera Corporate
//
// LICENSE:       EULA (End-User License Agreement)
// PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA
//
// WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
//                engenharia reversa ou modificação não autorizada.
//
// |---------------------------------------------------------------------------------------|
// |  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
// |---------------------------------------------------------------------------------------|

import { Module } from '@nestjs/common';
import { LifestyleController } from './lifestyle.controller';
import { LifestyleService } from './lifestyle.service';
import { AuthModule } from '../auth/auth.module';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [AuthModule, CoreModule],
  controllers: [LifestyleController],
  providers: [LifestyleService],
})
export class LifestyleModule {}
