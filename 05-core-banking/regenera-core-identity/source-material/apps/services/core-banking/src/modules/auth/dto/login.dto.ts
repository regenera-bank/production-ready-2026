/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Authentication

  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky

  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] login.dto.ts

import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * @description DTO para o endpoint de login.
 *              Apenas o básico para simular a autenticação.
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  // Em produção, usaríamos DTOs mais complexos, talvez com 2FA.
  // Por agora, isso é o suficiente para o fluxo de cookie.
  password: string;
}
