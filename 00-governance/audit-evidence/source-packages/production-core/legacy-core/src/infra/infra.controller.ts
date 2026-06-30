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

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { InfraService } from './infra.service';
import { NeuralAuthGuard } from '../auth/auth.guard';

@Controller('infra/cloud')
@UseGuards(NeuralAuthGuard) // Requires valid token. For SysAdmin, we check role/claims below.
export class InfraController {
  constructor(private readonly infra: InfraService) {}

  @Get('instances')
  async list(@Req() req: any) {
    // Even list requires auth; for full admin, could check claims here too.
    this.checkAdminClaim(req);
    return this.infra.listInstances();
  }

  @Post('toggle')
  async toggle(
    @Body() body: { instanceId: string; action: 'start' | 'stop' },
    @Req() req: any,
  ) {
    this.checkAdminClaim(req); // Enforce Custom Claim 'role: SysAdmin' or equivalent from Firebase IdToken / Neural payload before any infra mutation.
    // Biometric step-up enforced in frontend GCPDashboard before calling this.
    // Backend also relies on IAM roles for the Cloud Run service account.
    return this.infra.toggleInstance(body.instanceId, body.action);
  }

  private checkAdminClaim(req: any) {
    const user = req.user;
    // Support both Neural JWT payload (with role) and if Firebase claims passed through.
    const role =
      user?.role || user?.['role'] || (user?.claims && user.claims.role);
    if (role !== 'admin' && role !== 'SysAdmin') {
      throw new ForbiddenException(
        'Acesso negado. Requer cargo corporativo SysAdmin (Custom Claim no IdToken).',
      );
    }
  }
}
