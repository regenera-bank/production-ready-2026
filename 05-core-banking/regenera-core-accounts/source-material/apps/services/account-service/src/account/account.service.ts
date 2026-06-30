/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Account Service
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/account-service/src/account/account.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config'; // Config é lei.
import { Account } from './account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { Money } from '@repo/core';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly configService: ConfigService, 
  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const { userId } = createAccountDto;
    
    // Fail fast se já existe.
    const existingAccount = await this.accountRepository.findOne({ where: { userId } });
    if (existingAccount) {
      this.logger.warn(`Attempt to create duplicate account for user ${userId}`);
      throw new ConflictException(`An account for user ID "${userId}" already exists.`);
    }

    // Buscando saldo inicial do ambiente. (BUG #18)
    // Em PROD isso aqui TEM que ser 0, senão a Raphaela me demite.
    // Em DEV, a gente libera uns trocados pra testar.
    const initialBalanceCents = parseInt(
      this.configService.get('INITIAL_ACCOUNT_BALANCE_CENTS', '0'),
      10
    );

    const newAccount = this.accountRepository.create({
      userId,
      balance: Money.fromCents(initialBalanceCents),
    });

    this.logger.log(`Creating account for user ${userId} with initial balance ${initialBalanceCents}`);
    return this.accountRepository.save(newAccount);
  }

  async findByUserId(userId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { userId } });
    if (!account) {
      throw new NotFoundException(`Account for user ID "${userId}" not found.`);
    }
    return account;
  }

  async credit(accountId: string, amount: Money): Promise<Account> {
    // Lock pessimista aqui também pra garantir consistência total no Ledger, 
    // embora race condition em crédito seja menos destrutiva que em débito.
    const account = await this.findAccountWithLock_INTERNAL(accountId);
    
    account.balance = account.balance.add(amount);
    
    this.logger.log(`Crediting account ${accountId}: +${amount.toDecimal()}`);
    return this.accountRepository.save(account);
  }

  async debit(accountId: string, amount: Money): Promise<Account> {
    // 🔥 CRÍTICO: Pessimistic Write Lock para evitar Race Condition. (BUG #14)
    // Se duas threads tentarem debitar ao mesmo tempo, a segunda espera a primeira commitar.
    // Sem isso, a gente quebra.
    const account = await this.findAccountWithLock_INTERNAL(accountId);

    if (account.balance.isLessThan(amount)) {
      this.logger.warn(`Insufficient funds for account ${accountId}. Required: ${amount.toDecimal()}, Available: ${account.balance.toDecimal()}`);
      throw new ConflictException('Insufficient funds.');
    }

    account.balance = account.balance.subtract(amount);
    
    this.logger.log(`Debiting account ${accountId}: -${amount.toDecimal()}`);
    return this.accountRepository.save(account);
  }
  
  // Helper interno blindado com LOCK.
  private async findAccountWithLock_INTERNAL(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ 
      where: { id },
      lock: { mode: 'pessimistic_write' } // O banco de dados segura a bronca aqui.
    });

    if (!account) {
      throw new InternalServerErrorException(`Internal consistency error: Account ID "${id}" not found during locked operation.`);
    }
    return account;
  }

  // Mantendo o antigo para leituras simples sem lock (ex: saldo na UI)
  private async findAccountById_READONLY(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException();
    return account;
  }
}