/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Notification Service - Provider Mock
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/notification-service/src/notification/notification-provider.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppConfigService } from '@repo/config'; // Import AppConfigService
import { SendNotificationDto, NotificationType } from './dto/send-notification.dto';

// In a real application, you would initialize clients for services like Twilio, AWS SES, etc.
// Here, we provide a mock.

@Injectable()
export class NotificationProviderService {
  constructor(private readonly appConfigService: AppConfigService) {
    const twilioSid = this.appConfigService.get<string>('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = this.appConfigService.get<string>('TWILIO_AUTH_TOKEN');
    const awsSesRegion = this.appConfigService.get<string>('AWS_SES_REGION');

    if (!twilioSid || !twilioAuthToken) {
      console.warn('Twilio credentials not configured. SMS will be mocked.');
    }
    if (!awsSesRegion) {
      console.warn('AWS SES region not configured. Email will be mocked.');
    }
  }

  async sendNotification(dto: SendNotificationDto): Promise<{ status: string; providerId?: string }> {
    console.log(`--- EXTERNAL NOTIFICATION PROVIDER MOCK ---`);
    console.log(`Sending ${dto.type} to ${dto.recipient}: "${dto.message}"`);

    // Simulate latency and provider API calls
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));

    // Simulate failure rate for external provider
    if (Math.random() < 0.02) { // 2% chance of provider failure
      throw new InternalServerErrorException(`External provider failed for ${dto.type} to ${dto.recipient}.`);
    }

    let providerName: string;
    let providerMessageId: string;

    switch (dto.type) {
      case NotificationType.EMAIL:
        providerName = 'AWS SES Mock';
        providerMessageId = `ses-msg-${Date.now()}`;
        // Logic to call AWS SES SDK here
        break;
      case NotificationType.SMS:
        providerName = 'Twilio Mock';
        providerMessageId = `twilio-msg-${Date.now()}`;
        // Logic to call Twilio SDK here
        break;
      case NotificationType.PUSH:
        providerName = 'Firebase FCM Mock';
        providerMessageId = `fcm-msg-${Date.now()}`;
        // Logic to call Firebase FCM SDK here
        break;
      default:
        providerName = 'Unknown Provider Mock';
        providerMessageId = `mock-msg-${Date.now()}`;
    }

    console.log(`Notification sent via ${providerName} (Mock). Message ID: ${providerMessageId}`);
    console.log('-------------------------------------------');

    return { status: 'SENT', providerId: providerMessageId };
  }
}
