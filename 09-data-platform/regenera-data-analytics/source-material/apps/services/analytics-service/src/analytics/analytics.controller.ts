/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Analytics Controller
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/analytics-service/src/analytics/analytics.controller.ts
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AnalyticsService } from './analytics.service';

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Listens for 'transaction_completed' events from RabbitMQ.
   * This event will be logged for analytics purposes.
   */
  @EventPattern('transaction_completed')
  async handleTransactionCompleted(@Payload() data: any) {
    console.log('Analytics Service received TRANSACTION_COMPLETED event:', data);
    await this.analyticsService.logEvent({
      eventName: 'transaction_completed',
      serviceOrigin: 'pix-service',
      payload: data,
    });
  }
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
