/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Investment Module
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/investment-service/src/investment/investment.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InvestmentService } from './investment.service';
import { InvestmentController } from './investment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Investment, Portfolio } from './investment.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Investment, Portfolio]),
  ],
  providers: [InvestmentService],
  controllers: [InvestmentController],
})
export class InvestmentModule {}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
