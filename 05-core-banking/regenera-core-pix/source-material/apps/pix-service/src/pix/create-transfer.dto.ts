/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - PIX SERVICE
  Module: PIX Transfers

  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky

  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] create-transfer.dto.ts

import { IsInt, IsNotEmpty, IsPositive, IsString, IsUUID } from 'class-validator';

/**
 * @description DTO para a criação de uma transferência PIX.
 *              [BUG #12 CORRIGIDO] Validações estritas para garantir que apenas
 *              dados válidos e seguros iniciem uma transação financeira.
 */
export class CreateTransferDto {
  @IsUUID(4)
  @IsNotEmpty()
  sourceAccountId: string;

  @IsString()
  @IsNotEmpty()
  destinationAccountKey: string; // Chave PIX (CPF, e-mail, etc.)

  @IsInt()
  @IsPositive()
  // O valor deve ser sempre um inteiro em centavos para evitar problemas de ponto flutuante.
  amountInCents: number;
}
