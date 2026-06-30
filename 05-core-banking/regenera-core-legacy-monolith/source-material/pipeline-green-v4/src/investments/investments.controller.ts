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
  Headers,
} from '@nestjs/common';
import { IsString, IsNumber, IsIn, Min, IsOptional } from 'class-validator';
import { InvestmentsService } from './investments.service';
import { NeuralAuthGuard } from '../auth/auth.guard';

class TradeDto {
  @IsString() symbol: string;
  @IsNumber() @Min(1) quantity: number;
  @IsIn(['BUY', 'SELL']) type: 'BUY' | 'SELL';
  @IsOptional() @IsString() idempotencyKey?: string;
}

@Controller('investments')
@UseGuards(NeuralAuthGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get('portfolio')
  async getPortfolio(@Req() req: any) {
    // Real user portfolio from DB (desmocks the facade)
    return this.investmentsService.findAll(req.user.sub);
  }

  @Post('trade')
  async trade(
    @Req() req: any,
    @Body() dto: TradeDto,
    @Headers('idempotency-key') headerIdemKey?: string,
  ) {
    const idemKey = headerIdemKey || dto.idempotencyKey;
    return this.investmentsService.executeTrade(
      req.user.sub,
      dto.symbol,
      dto.quantity,
      dto.type,
      idemKey,
    );
  }
}
