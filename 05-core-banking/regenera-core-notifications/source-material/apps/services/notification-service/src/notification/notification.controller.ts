/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Notification Controller
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/notification-service/src/notification/notification.controller.ts
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/send-notification.dto'; // Re-use the DTO for the event payload

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Listens for 'transaction_completed' events from RabbitMQ.
   * This is an event-driven microservice endpoint.
   */
  @EventPattern('transaction_completed')
  async handleTransactionCompleted(@Payload() data: any) {
    console.log('Notification Service received TRANSACTION_COMPLETED event:', data);

    // Construct a notification message based on the transaction data
    const notificationDto: SendNotificationDto = {
      type: 'EMAIL', // Or 'SMS', 'PUSH' based on user preferences / event type
      recipient: data.userId, // Assuming userId is email or can be mapped to one
      message: `Sua transferência de R$ ${(data.amountInCents / 100).toFixed(2)} para ${data.destinationAccountId} foi concluída com sucesso!`,
    };
    
    await this.notificationService.send(notificationDto);
  }
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
