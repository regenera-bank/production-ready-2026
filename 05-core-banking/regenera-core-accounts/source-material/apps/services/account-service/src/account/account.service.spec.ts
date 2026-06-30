/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Account Service - Unit Tests
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/account-service/src/account/account.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountService } from './account.service';
import { Account } from './account.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Money } from '@repo/core';
import { ConfigService } from '@nestjs/config';

const mockAccountRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
});

const mockConfigService = {
  get: jest.fn((key, defaultValue) => {
    if (key === 'INITIAL_ACCOUNT_BALANCE_CENTS') return '0'; // Default for prod-like test
    return defaultValue;
  }),
};

describe('AccountService (Unit)', () => {
  let service: AccountService;
  let accountRepository: Repository<Account>;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getRepositoryToken(Account),
          useFactory: mockAccountRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    accountRepository = module.get<Repository<Account>>(getRepositoryToken(Account));
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new account for a user with configurable initial balance', async () => {
      const createAccountDto = { userId: 'new-user-id' };
      const mockAccount = { id: 'new-acc-id', userId: 'new-user-id', balance: Money.fromCents(0), createdAt: new Date(), updatedAt: new Date() };
      
      (accountRepository.findOne as jest.Mock).mockResolvedValue(undefined); // No existing account
      (accountRepository.create as jest.Mock).mockReturnValue(mockAccount);
      (accountRepository.save as jest.Mock).mockResolvedValue(mockAccount);

      const result = await service.create(createAccountDto);
      expect(result).toEqual(mockAccount);
      expect(accountRepository.findOne).toHaveBeenCalledWith({ where: { userId: 'new-user-id' } });
      // Verify initial balance is 0 as per mock config
      expect(accountRepository.create).toHaveBeenCalledWith({ userId: 'new-user-id', balance: expect.objectContaining({ amountInCents: 0 }) });
      expect(accountRepository.save).toHaveBeenCalledWith(mockAccount);
    });

    it('should throw ConflictException if account already exists for user', async () => {
      const createAccountDto = { userId: 'existing-user-id' };
      (accountRepository.findOne as jest.Mock).mockResolvedValue({ id: 'existing-acc-id', userId: 'existing-user-id' });

      await expect(service.create(createAccountDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('debit', () => {
    it('should debit the account balance using pessimistic write lock', async () => {
      const initialBalance = Money.fromCents(10000);
      const debitAmount = Money.fromCents(5000);
      const mockAccount = { id: 'acc-to-debit', userId: 'user', balance: initialBalance };
      const expectedBalance = initialBalance.subtract(debitAmount);

      // Mock finding account WITH LOCK
      (accountRepository.findOne as jest.Mock).mockResolvedValue(mockAccount);
      (accountRepository.save as jest.Mock).mockImplementation(async (account) => account);

      const result = await service.debit('acc-to-debit', debitAmount);
      
      // Verify lock usage
      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'acc-to-debit' },
        lock: { mode: 'pessimistic_write' },
      });
      
      expect(result.balance.getAmountInCents()).toBe(expectedBalance.getAmountInCents());
      expect(accountRepository.save).toHaveBeenCalledWith(expect.objectContaining({ balance: expectedBalance }));
    });

    it('should throw ConflictException if insufficient funds', async () => {
      const initialBalance = Money.fromCents(1000);
      const debitAmount = Money.fromCents(5000);
      const mockAccount = { id: 'acc-to-debit', userId: 'user', balance: initialBalance };

      (accountRepository.findOne as jest.Mock).mockResolvedValue(mockAccount);

      await expect(service.debit('acc-to-debit', debitAmount)).rejects.toThrow(ConflictException);
      expect(accountRepository.save).not.toHaveBeenCalled();
    });
  });
});