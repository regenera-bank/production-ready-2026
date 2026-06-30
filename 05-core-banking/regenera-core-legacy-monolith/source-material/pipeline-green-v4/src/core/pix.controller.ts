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
  Post,
  Get,
  Delete,
  Body,
  Req,
  UseGuards,
  Headers,
  Param,
  Res,
} from '@nestjs/common';
import { IsString, IsNumber, Min } from 'class-validator';
import { PixService } from './pix.service';
import { NeuralAuthGuard } from '../auth/auth.guard';

class TransferDto {
  @IsString() key: string;
  @IsNumber() @Min(0.01) amount: number;
}

@Controller('pix')
@UseGuards(NeuralAuthGuard)
export class PixController {
  constructor(private readonly pixService: PixService) {}

  @Post('transfer')
  async transfer(
    @Req() req: any,
    @Body() dto: TransferDto,
    @Headers('idempotency-key') idemKey: string,
    @Res() res: any,
  ) {
    const result = await this.pixService.executePix(
      req.user.sub,
      dto.key,
      dto.amount,
      idemKey,
    );
    if (result && result.isCached) {
      const { isCached, ...payload } = result;
      return res.status(200).json(payload);
    }
    return res.status(201).json(result);
  }

  // Real chaves management for "Minhas Chaves" tab (per spec)
  @Get('keys')
  async listKeys(@Req() req: any) {
    return this.pixService.listPixKeys(req.user.sub);
  }

  @Post('keys')
  async createKey(
    @Req() req: any,
    @Body() dto: { type: string; value: string },
  ) {
    return this.pixService.createPixKey(req.user.sub, dto.type, dto.value);
  }

  @Delete('keys/:id')
  async deleteKey(@Req() req: any, @Param('id') id: string) {
    return this.pixService.deletePixKey(req.user.sub, id);
  }

  // Real receive: generate code/QR for "Receber" (per spec)
  @Post('receive')
  async createReceive(@Req() req: any, @Body() dto: { amount?: number }) {
    return this.pixService.generateReceiveCode(req.user.sub, dto.amount);
  }
}
