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
import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { NeuralService } from './neural.service';
import { NeuralAuthGuard } from '../auth/auth.guard';

@Controller('v1/neural')
@UseGuards(NeuralAuthGuard)
export class NeuralController {
  constructor(private readonly neuralService: NeuralService) {}

  private getNeuralId(req: any): string {
    const neuralId = req.user?.sub || req.user?.neuralId;
    if (!neuralId)
      throw new UnauthorizedException('Identidade Neural não identificada.');
    return neuralId;
  }

  @Get('smart-statement')
  async getInsights(@Req() req: any) {
    return this.neuralService.generateFinancialInsights(this.getNeuralId(req));
  }

  @Post('process')
  async processInteraction(@Body() body: { prompt: string }, @Req() req: any) {
    return this.neuralService.processInteraction(
      this.getNeuralId(req),
      body.prompt,
    );
  }

  @Post('tts')
  async textToSpeech(@Body() body: { text: string }, @Req() req: any) {
    const result = await this.neuralService.processInteraction(
      this.getNeuralId(req),
      `Speak this text naturally: ${body.text}`,
    );
    return { audioBase64: result.audioBase64 || null };
  }
}
