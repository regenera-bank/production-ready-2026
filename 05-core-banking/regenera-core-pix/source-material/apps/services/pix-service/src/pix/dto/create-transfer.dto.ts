/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: PIX DTOs
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/pix-service/src/pix/dto/create-transfer.dto.ts
import { IsNotEmpty, IsNumber, IsString, IsPositive } from 'class-validator';

export class CreateTransferDto {
  @IsString()
  @IsNotEmpty()
  sourceAccountId: string;

  @IsString()
  @IsNotEmpty()
  destinationAccountId: string;

  @IsNumber()
  @IsPositive()
  amountInCents: number;
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
