/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Investment Service - Unit Tests
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/investment-service/src/investment/investment.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvestmentService } from './investment.service';
import { Portfolio, Investment } from './investment.entity';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Money } from '@repo/core';

const mockPortfolioRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockInvestmentRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
});

const mockHttpService = {
  patch: jest.fn(),
};

describe('InvestmentService (Unit)', () => {
  let service: InvestmentService;
  let portfolioRepository: Repository<Portfolio>;
  let investmentRepository: Repository<Investment>;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentService,
        {
          provide: getRepositoryToken(Portfolio),
          useFactory: mockPortfolioRepository,
        },
        {
          provide: getRepositoryToken(Investment),
          useFactory: mockInvestmentRepository,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<InvestmentService>(InvestmentService);
    portfolioRepository = module.get<Repository<Portfolio>>(getRepositoryToken(Portfolio));
    investmentRepository = module.get<Repository<Investment>>(getRepositoryToken(Investment));
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPortfolio', () => {
    it('should create and return a new investment portfolio', async () => {
      const createPortfolioDto = { userId: 'user123', name: 'My Test Portfolio' };
      const mockPortfolio = { id: 'port123', ...createPortfolioDto, investments: [] };

      (portfolioRepository.create as jest.Mock).mockReturnValue(mockPortfolio);
      (portfolioRepository.save as jest.Mock).mockResolvedValue(mockPortfolio);

      const result = await service.createPortfolio(createPortfolioDto);
      expect(result).toEqual(mockPortfolio);
      expect(portfolioRepository.create).toHaveBeenCalledWith(createPortfolioDto);
      expect(portfolioRepository.save).toHaveBeenCalledWith(mockPortfolio);
    });
  });

  describe('findPortfoliosByUserId', () => {
    it('should return an array of portfolios for a user', async () => {
      const mockPortfolios = [{ id: 'port1', userId: 'user123', name: 'P1' }];
      (portfolioRepository.find as jest.Mock).mockResolvedValue(mockPortfolios);

      const result = await service.findPortfoliosByUserId('user123');
      expect(result).toEqual(mockPortfolios);
      expect(portfolioRepository.find).toHaveBeenCalledWith({ where: { userId: 'user123' }, relations: ['investments'] });
    });
  });

  describe('createInvestment', () => {
    const mockPortfolio = { id: 'port123', userId: 'user123', name: 'P1', investments: [] };
    const createInvestmentDto = { asset: 'AAPL', quantity: 10, totalAmountInCents: 150000 }; // $1500.00 for 10 shares
    const accountId = 'acc123';
    
    beforeEach(() => {
        (portfolioRepository.findOne as jest.Mock).mockResolvedValue(mockPortfolio);
        (httpService.patch as jest.Mock).mockReturnValue(of({ data: {} })); // Mock successful debit
    });

    it('should create a new investment and debit the account', async () => {
      const mockInvestment = { id: 'inv1', asset: 'AAPL', quantity: 10, purchasePrice: Money.fromCents(15000), portfolio: mockPortfolio };
      (investmentRepository.create as jest.Mock).mockReturnValue(mockInvestment);
      (investmentRepository.save as jest.Mock).mockResolvedValue(mockInvestment);

      const result = await service.createInvestment(mockPortfolio.id, accountId, createInvestmentDto);
      expect(result).toEqual(mockInvestment);
      expect(portfolioRepository.findOne).toHaveBeenCalledWith({ where: { id: mockPortfolio.id } });
      expect(httpService.patch).toHaveBeenCalledWith(`http://localhost:3003/internal/accounts/${accountId}/debit`, { amountInCents: createInvestmentDto.totalAmountInCents });
      expect(investmentRepository.create).toHaveBeenCalledWith(expect.objectContaining({ asset: createInvestmentDto.asset }));
      expect(investmentRepository.save).toHaveBeenCalledWith(mockInvestment);
    });

    it('should throw NotFoundException if portfolio not found', async () => {
      (portfolioRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.createInvestment('nonexistent-port', accountId, createInvestmentDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if account debit fails', async () => {
      (httpService.patch as jest.Mock).mockReturnValue(throwError(() => new Error('Debit failed')));

      await expect(service.createInvestment(mockPortfolio.id, accountId, createInvestmentDto)).rejects.toThrow(InternalServerErrorException);
      expect(httpService.patch).toHaveBeenCalled();
    });
  });
});
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
