/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Notification DTO
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/notification-service/src/notification/dto/send-notification.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export class SendNotificationDto {
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  recipient: string; // Could be email, phone number, or user ID

  @IsString()
  @IsNotEmpty()
  message: string;
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
