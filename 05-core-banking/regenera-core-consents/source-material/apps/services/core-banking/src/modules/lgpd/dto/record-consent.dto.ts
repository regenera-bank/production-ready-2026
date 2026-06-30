/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: LGPD Consent Management

  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky

  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] record-consent.dto.ts

import { IsBoolean, IsNotEmpty, IsString, IsIP, IsOptional } from 'class-validator';

/**
 * @description DTO para registrar o consentimento do usuário.
 *              Aderente à LGPD, capturando o essencial para validade jurídica.
 *              Sanitização e validação paranoica são aplicadas via `class-validator`.
 */
export class RecordConsentDto {
  @IsString()
  @IsNotEmpty()
  // Em análise forense, isso aqui prova a integridade da transação.
  userId: string;

  @IsBoolean()
  // O consentimento deve ser explícito. True = aceitou, false = revogou.
  hasConsented: boolean;

  @IsString()
  @IsNotEmpty()
  // Versionamento dos termos para garantir que o usuário aceitou a versão correta.
  termsVersion: string;

  @IsIP()
  // IP do usuário para auditoria. Essencial para rastrear a origem do consentimento.
  ipAddress: string;

  @IsString()
  @IsOptional()
  // User-Agent para contexto adicional. Pode ser usado para identificar bots.
  userAgent?: string;
}
