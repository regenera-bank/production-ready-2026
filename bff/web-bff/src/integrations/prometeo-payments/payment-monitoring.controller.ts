import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionGuard } from '../../auth/session.guard';
import { SessionRecord } from '../../auth/auth.service';
import { PaymentMonitoringService } from './payment-monitoring.service';
import type { PrometeoPaymentWebhookBody } from './prometeo-payments.types';

interface PollBody {
  readonly dateStart?: string;
  readonly dateEnd?: string;
}

interface CreateIntentBody {
  readonly amount: string;
  readonly currency?: string;
  readonly concept?: string;
  readonly reference?: string;
}

type AuthedRequest = Request & { session: SessionRecord };

@Controller('prometeo/payments')
export class PaymentMonitoringController {
  constructor(private readonly monitoring: PaymentMonitoringService) {}

  @Get('config')
  widgetConfig() {
    return this.monitoring.getWidgetConfig();
  }

  /** Payments API v2 — cria intent antes de Prometeo.init(widgetId, intentId) */
  @Post('intent')
  @UseGuards(SessionGuard)
  createIntent(@Req() req: AuthedRequest, @Body() body: CreateIntentBody) {
    if (!body.amount?.trim()) {
      throw new BadRequestException('amount obrigatório');
    }
    return this.monitoring.createPaymentIntent(req.session.userId, body);
  }

  /** Opção recomendada: webhook Prometeo → enriquece com GET /transfer/logs/{request_id}/ */
  @Post('webhook')
  handleWebhook(@Body() body: PrometeoPaymentWebhookBody) {
    return this.monitoring.handleWebhook(body);
  }

  /** Opção 2: polling manual (cron) do listado de transferências */
  @Post('poll')
  @UseGuards(SessionGuard)
  pollTransfers(@Body() body: PollBody) {
    const dateStart = body.dateStart?.trim();
    const dateEnd = body.dateEnd?.trim();
    if (!dateStart || !dateEnd) {
      throw new BadRequestException(
        'dateStart e dateEnd obrigatórios (DD/MM/YYYY)',
      );
    }
    this.monitoring.assertPollDates(dateStart, dateEnd);
    return this.monitoring.pollTransferLogs({ dateStart, dateEnd });
  }

  @Get('monitored')
  @UseGuards(SessionGuard)
  listMonitored() {
    return {
      items: this.monitoring.listMonitored(),
      mode: 'webhook+detail',
    };
  }

  @Get('monitored/:requestId')
  @UseGuards(SessionGuard)
  getMonitored(@Param('requestId') requestId: string) {
    const item = this.monitoring.getMonitored(requestId.trim());
    if (!item) {
      return { found: false as const };
    }
    return { found: true as const, item };
  }
}