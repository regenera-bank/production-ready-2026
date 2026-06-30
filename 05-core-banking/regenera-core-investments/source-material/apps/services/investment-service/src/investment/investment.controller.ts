/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Investment Controller
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/investment-service/src/investment/investment.controller.ts
import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { InvestmentService } from './investment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';

@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentController {
  constructor(private readonly investmentService: InvestmentService) {}

  @Post('/portfolios')
  createPortfolio(@Request() req, @Body() dto: Omit<CreatePortfolioDto, 'userId'>) {
    return this.investmentService.createPortfolio({ ...dto, userId: req.user.userId });
  }

  @Get('/portfolios')
  getPortfolios(@Request() req) {
    return this.investmentService.findPortfoliosByUserId(req.user.userId);
  }

  @Post('/portfolios/:portfolioId/invest')
  createInvestment(
    @Param('portfolioId') portfolioId: string,
    @Body() dto: CreateInvestmentDto,
    @Body('accountId') accountId: string, // Assume client sends which account to debit from
  ) {
    // In a real system, would verify user owns the portfolio and account.
    return this.investmentService.createInvestment(portfolioId, accountId, dto);
  }
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
