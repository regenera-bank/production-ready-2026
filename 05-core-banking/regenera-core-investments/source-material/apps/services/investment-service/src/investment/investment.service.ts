/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Investment Service
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/investment-service/src/investment/investment.service.ts
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Money } from '@repo/core';
import { Portfolio, Investment } from './investment.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class InvestmentService {
  private readonly accountServiceBaseUrl = 'http://localhost:3003';

  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Investment)
    private readonly investmentRepository: Repository<Investment>,
    private readonly httpService: HttpService,
  ) {}

  async createPortfolio(dto: CreatePortfolioDto): Promise<Portfolio> {
    const newPortfolio = this.portfolioRepository.create(dto);
    return this.portfolioRepository.save(newPortfolio);
  }

  async findPortfoliosByUserId(userId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({ where: { userId }, relations: ['investments'] });
  }

  async createInvestment(portfolioId: string, accountId: string, dto: CreateInvestmentDto): Promise<Investment> {
    const portfolio = await this.portfolioRepository.findOne({ where: { id: portfolioId } });
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found.');
    }

    const amountToDebit = Money.fromCents(dto.totalAmountInCents);

    try {
      const url = `${this.accountServiceBaseUrl}/internal/accounts/${accountId}/debit`;
      await firstValueFrom(this.httpService.patch(url, { amountInCents: amountToDebit.getAmountInCents() }));
    } catch (error) {
      console.error('Failed to debit account for investment:', error.response?.data);
      throw new InternalServerErrorException('Failed to process payment for investment.');
    }

    const newInvestment = this.investmentRepository.create({
      asset: dto.asset,
      quantity: dto.quantity,
      purchasePrice: Money.fromCents(dto.totalAmountInCents / dto.quantity),
      portfolio: portfolio,
    });
    
    return this.investmentRepository.save(newInvestment);
  }
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
