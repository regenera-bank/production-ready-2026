/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Notification Service
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/notification-service/src/notification/notification.service.ts
import { Injectable } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationProviderService } from './notification-provider.service'; // Import the new service

@Injectable()
export class NotificationService {
  constructor(private readonly notificationProviderService: NotificationProviderService) {}

  /**
   * Delegates sending a notification to the NotificationProviderService.
   * This service acts as an abstraction layer for various external notification providers.
   */
  async send(dto: SendNotificationDto): Promise<{ status: string }> {
    // In a real system, you might have logic here to determine which provider to use
    // based on NotificationType or user preferences.
    const result = await this.notificationProviderService.sendNotification(dto);
    return { status: result.status };
  }
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
