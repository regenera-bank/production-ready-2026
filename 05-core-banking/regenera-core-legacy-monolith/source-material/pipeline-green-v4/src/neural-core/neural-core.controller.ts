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
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { NeuralCoreService, AnalysisType } from './neural-core.service';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

class ChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

class AnalyzeDto {
  @IsString()
  @IsNotEmpty()
  type: AnalysisType;

  @IsOptional()
  data: unknown;
}

@Controller('neural-core')
export class NeuralCoreController {
  constructor(private readonly svc: NeuralCoreService) {}

  /**
   * POST /v1/neural-core/chat
   * Send a message to Raphaela and receive a contextual financial response.
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@Body() body: ChatDto) {
    if (!body?.message?.trim()) {
      throw new BadRequestException('message is required');
    }
    return this.svc.chat(body.message, body.context, body.userId);
  }

  /**
   * POST /v1/neural-core/analyze
   * Analyse spending patterns, investment opportunities or fraud signals.
   */
  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  analyze(@Body() body: AnalyzeDto) {
    const allowed: AnalysisType[] = ['investment', 'spending', 'fraud'];
    if (!allowed.includes(body?.type)) {
      throw new BadRequestException(
        `type must be one of: ${allowed.join(', ')}`,
      );
    }
    return this.svc.analyze(body.type, body.data);
  }

  /**
   * GET /v1/neural-core/insight?userId=string
   * Returns a personalised daily financial insight. Never throws — falls back gracefully.
   */
  @Get('insight')
  getInsight(@Query('userId') userId: string) {
    return this.svc.getInsight(userId);
  }

  /**
   * POST /v1/neural-core/delinquency-analysis
   * Run risk analysis on transaction logs of the last 7 days and generate plans.
   */
  @Post('delinquency-analysis')
  @HttpCode(HttpStatus.OK)
  analyzeDelinquencyRisk() {
    return this.svc.analyzeDelinquencyRisk();
  }
}
