/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Card DTOs
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/card-service/src/card/dto/update-status.dto.ts
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CardStatus } from '../card.entity';

export class UpdateCardStatusDto {
  @ApiProperty({ description: 'New status for the card.', enum: ['ACTIVE', 'BLOCKED'], example: 'BLOCKED' })
  @IsEnum(['ACTIVE', 'BLOCKED']) // Users can only set these statuses
  @IsNotEmpty()
  status: 'ACTIVE' | 'BLOCKED';
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/