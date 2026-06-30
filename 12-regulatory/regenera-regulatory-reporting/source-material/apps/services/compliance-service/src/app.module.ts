/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Compliance Service Root Module
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/compliance-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { ComplianceModule } from './compliance/compliance.module';
import { AppConfigModule } from '@repo/config'; // Import AppConfigModule

@Module({
  imports: [
    AppConfigModule, // Integrate AppConfigModule
    ComplianceModule
  ],
})
export class AppModule {}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
