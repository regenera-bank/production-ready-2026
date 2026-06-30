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
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { LifestyleService } from './lifestyle.service';
import { NeuralAuthGuard } from '../auth/auth.guard';

class DreamContribDto {
  @IsString() dreamId: string;
  @IsNumber() @Min(1) amount: number;
  @IsOptional() @IsString() idempotencyKey?: string;
}

class BuyDto {
  @IsString() productId: string;
  @IsOptional() @IsString() idempotencyKey?: string;
}

@Controller('lifestyle')
@UseGuards(NeuralAuthGuard)
export class LifestyleController {
  constructor(private readonly lifestyleService: LifestyleService) {}

  @Post('dream-vault/contribute')
  async contribute(
    @Req() req: any,
    @Body() dto: DreamContribDto,
    @Headers('idempotency-key') headerIdemKey?: string,
  ) {
    const idemKey = headerIdemKey || dto.idempotencyKey;
    return this.lifestyleService.addFundsToDream(
      req.user.sub,
      dto.dreamId,
      dto.amount,
      idemKey,
    );
  }

  @Post('marketplace/buy')
  async buy(
    @Req() req: any,
    @Body() dto: BuyDto,
    @Headers('idempotency-key') headerIdemKey?: string,
  ) {
    const idemKey = headerIdemKey || dto.idempotencyKey;
    return this.lifestyleService.processMarketplacePurchase(
      req.user.sub,
      dto.productId,
      idemKey,
    );
  }

  @Get('dream-vault')
  async listDreams(@Req() req: any) {
    // Real list from Firestore (with seed fallback) — now the Cofre facade can be live
    return this.lifestyleService.listDreams(req.user.sub);
  }
}
