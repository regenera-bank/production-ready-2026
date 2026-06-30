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

// [FILE] register-user.dto.ts

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * @description DTO para o endpoint de registro de usuário.
 *              [BUG #12 CORRIGIDO] Validações estritas são aplicadas para garantir
 *              a integridade dos dados de entrada.
 */
export class RegisterUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'A senha deve ter no mínimo 10 caracteres.' })
  // Em produção, adicionaríamos validações mais complexas (e.g., regex para força da senha).
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;
}
