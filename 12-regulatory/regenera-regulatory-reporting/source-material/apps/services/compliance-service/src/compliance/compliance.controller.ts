/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Compliance Controller
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/compliance-service/src/compliance/compliance.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { CheckTransactionDto } from './dto/check-transaction.dto';
import { CheckUserDto } from './dto/check-user.dto';

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  /**
   * Internal endpoint for other services to request a transaction compliance check.
   */
  @Post('check-transaction')
  checkTransaction(@Body() dto: CheckTransactionDto) {
    return this.complianceService.checkTransaction(dto);
  }

  /**
   * Internal endpoint for other services to request a user compliance check.
   */
  @Post('check-user')
  checkUser(@Body() dto: CheckUserDto) {
    return this.complianceService.checkUser(dto);
  }
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
