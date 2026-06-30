/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Analytics DTO
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/analytics-service/src/analytics/dto/log-event.dto.ts
import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class LogEventDto {
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @IsString()
  @IsNotEmpty()
  serviceOrigin: string; // e.g., 'auth-service', 'pix-service'

  @IsObject()
  payload: Record<string, any>;
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
