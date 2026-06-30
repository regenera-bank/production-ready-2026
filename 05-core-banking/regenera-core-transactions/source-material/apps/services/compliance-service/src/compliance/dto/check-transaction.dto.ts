/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Compliance DTOs
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/compliance-service/src/compliance/dto/check-transaction.dto.ts
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CheckTransactionDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number; // In cents

  @IsString()
  @IsNotEmpty()
  recipientId: string;
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
