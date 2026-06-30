/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Account DTOs
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/account-service/src/account/dto/create-account.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ description: 'The ID of the user to whom this account belongs.', example: 'user-uuid-123' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/