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

import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Logger,
  Param,
} from '@nestjs/common';
import { CoreService } from './core.service';
import { NeuralAuthGuard } from '../auth/auth.guard';

@Controller('core')
@UseGuards(NeuralAuthGuard)
export class CoreController {
  private readonly logger = new Logger(CoreController.name);
  constructor(private readonly coreService: CoreService) {}

  /** Dashboard data for HomeScreen.tsx (saldo + recentes) */
  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    return this.coreService.getDashboard(req.user.sub);
  }

  /** Reveal card CVV via Secret Manager (Cards.tsx) */
  @Get('cards/:id/cvv')
  async revealCvv(@Req() req: any, @Param('id') cardId: string) {
    return this.coreService.revealCardCvv(req.user.sub, cardId);
  }

  /** Endpoint simples de saldo (pode ser usado para atualizações rápidas) */
  @Get('balance')
  async getBalance(@Req() req: any) {
    return this.coreService.getBalance(req.user.sub);
  }

  /**
   * Internal transfer (TED-like) between accounts.
   * For foundation, receiverId can be the account number or neural id.
   */
  @Post('transfer')
  async transfer(
    @Req() req: any,
    @Body() body: { receiverId: string; amount: number },
  ) {
    return this.coreService.transfer(
      req.user.sub,
      body.receiverId,
      Math.round(body.amount * 100),
    );
  }
}
