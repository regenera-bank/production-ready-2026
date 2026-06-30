/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Compliance Module
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/compliance-service/src/compliance/compliance.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importar TypeOrmModule
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { SanctionBureauService } from './sanction-bureau.service';
import { UserConsent } from '../consent/user-consent.entity'; // Importar UserConsent entity

@Module({
  imports: [
    TypeOrmModule.forFeature([UserConsent]), // Registrar a entidade UserConsent
  ],
  providers: [ComplianceService, SanctionBureauService],
  controllers: [ComplianceController],
})
export class ComplianceModule {}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
