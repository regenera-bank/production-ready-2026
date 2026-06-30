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

// [FILE] apps/services/account-service/src/account/dto/update-balance.dto.ts
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Money } from '@repo/core'; // Assuming Money Value Object

export class UpdateBalanceDto {
  // We receive amountInCents from the client and convert to Money VO internally.
  // This DTO could also directly receive Money, but often JSON doesn't naturally map VOs.
  @ApiProperty({
    description: 'Amount in cents to update the balance. Must be a positive integer.',
    example: 10000 // Represents R$ 100.00
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amountInCents: number;

  // Internal property, not exposed via API directly
  public get amount(): Money {
    return Money.fromCents(this.amountInCents);
  }
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/