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

import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SecurityService } from './security.service';
import { NeuralAuthGuard } from '../auth/auth.guard';

@Controller('security')
@UseGuards(NeuralAuthGuard)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Post('emergency-block')
  async emergencyBlock(@Req() req: any) {
    return this.securityService.emergencyLockdown(req.user.sub);
  }

  /**
   * SOS Senior real endpoint.
   * Triggered from Regenera Senior screen "AJUDA / SOS".
   * Real call with IdToken (via guard), publishes to events for family/support notification (Pub/Sub or FCM).
   * No fake alert only - motor real.
   */
  @Post('sos')
  async triggerSOS(
    @Req() req: any,
    @Body() body: { reason?: string; location?: string },
  ) {
    return this.securityService.triggerSOS(req.user.sub, body);
  }
}
