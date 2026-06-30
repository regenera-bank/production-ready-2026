/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - PIX SERVICE - UNIT TESTS
  Module: PIX Core Logic
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/pix-service/src/pix/pix.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PixService } from './pix.service';
import { Repository } from 'typeorm';
import { PixTransaction } from './pix-transaction.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AccountService } from '../../account-service/src/account/account.service'; // Assumindo import do account-service
import { Money } from '@repo/core';
import { v4 as uuidv4 } from 'uuid';
import { SagaLog } from './saga-log.entity';
import { SagaState } from './saga-state.enum';

// Don Paulo: Mockar repositórios e serviços externos é a base do teste unitário.
// Aqui garantimos que o PixService funcione, não que o banco ou o account-service funcionem.
const mockPixTransactionRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

const mockSagaLogRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
});

const mockAccountService = () => ({
  findByUserId: jest.fn(),
  debit: jest.fn(),
  credit: jest.fn(),
});

describe('PixService (Unit)', () => {
  let service: PixService;
  let pixTransactionRepository: Repository<PixTransaction>;
  let sagaLogRepository: Repository<SagaLog>;
  let accountService: AccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PixService,
        {
          provide: getRepositoryToken(PixTransaction),
          useFactory: mockPixTransactionRepository,
        },
        {
          provide: getRepositoryToken(SagaLog),
          useFactory: mockSagaLogRepository,
        },
        {
          provide: AccountService,
          useFactory: mockAccountService,
        },
      ],
    }).compile();

    service = module.get<PixService>(PixService);
    pixTransactionRepository = module.get<Repository<PixTransaction>>(getRepositoryToken(PixTransaction));
    sagaLogRepository = module.get<Repository<SagaLog>>(getRepositoryToken(SagaLog));
    accountService = module.get<AccountService>(AccountService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('createPixTransaction', () => {
    const createDto: CreateTransferDto = {
      senderUserId: uuidv4(),
      receiverPixKey: '111222333-44',
      amount: 10000, // R$ 100,00 em centavos
    };
    const mockPixTransaction = {
      id: uuidv4(),
      ...createDto,
      amount: Money.fromCents(createDto.amount),
      status: SagaState.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PixTransaction;

    it('deve criar uma nova transação PIX com sucesso', async () => {
      // Don Paulo: Simulamos que não existe transação pendente para este sender
      jest.spyOn(pixTransactionRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(pixTransactionRepository, 'create').mockReturnValue(mockPixTransaction);
      jest.spyOn(pixTransactionRepository, 'save').mockResolvedValue(mockPixTransaction);
      jest.spyOn(sagaLogRepository, 'create').mockReturnValue({ /* mock */ });
      jest.spyOn(sagaLogRepository, 'save').mockResolvedValue({ /* mock */ });

      const result = await service.createPixTransaction(createDto);

      expect(result).toEqual(mockPixTransaction);
      expect(pixTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { senderUserId: createDto.senderUserId, status: SagaState.PENDING },
      });
      expect(pixTransactionRepository.create).toHaveBeenCalledWith({
        senderUserId: createDto.senderUserId,
        receiverPixKey: createDto.receiverPixKey,
        amount: Money.fromCents(createDto.amount),
        status: SagaState.PENDING,
      });
      expect(pixTransactionRepository.save).toHaveBeenCalledWith(mockPixTransaction);
      expect(sagaLogRepository.save).toHaveBeenCalledTimes(1);
    });

    it('não deve criar uma transação se já houver uma pendente para o sender', async () => {
      jest.spyOn(pixTransactionRepository, 'findOne').mockResolvedValue(mockPixTransaction);

      await expect(service.createPixTransaction(createDto)).rejects.toThrow(ConflictException);
      expect(pixTransactionRepository.create).not.toHaveBeenCalled();
      expect(pixTransactionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('processPixTransaction', () => {
    const transactionId = uuidv4();
    const senderUserId = uuidv4();
    const receiverPixKey = '111222333-44';
    const amountInCents = 5000; // R$ 50,00

    const mockPendingPixTransaction = {
      id: transactionId,
      senderUserId: senderUserId,
      receiverPixKey: receiverPixKey,
      amount: Money.fromCents(amountInCents),
      status: SagaState.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PixTransaction;

    const mockSenderAccount = {
      id: uuidv4(),
      userId: senderUserId,
      balance: Money.fromCents(10000), // R$ 100,00 de saldo
    };

    it('deve processar uma transação PIX com sucesso', async () => {
      jest.spyOn(pixTransactionRepository, 'findOne').mockResolvedValue(mockPendingPixTransaction);
      jest.spyOn(accountService, 'findByUserId').mockResolvedValue(mockSenderAccount);
      jest.spyOn(accountService, 'debit').mockResolvedValue({
        ...mockSenderAccount,
        balance: Money.fromCents(mockSenderAccount.balance.getAmountInCents() - amountInCents),
      });
      jest.spyOn(pixTransactionRepository, 'save').mockResolvedValue({
        ...mockPendingPixTransaction,
        status: SagaState.DEBIT_SUCCESS,
      });
      jest.spyOn(sagaLogRepository, 'create').mockReturnValue({ /* mock */ });
      jest.spyOn(sagaLogRepository, 'save').mockResolvedValue({ /* mock */ });

      const result = await service.processPixTransaction(transactionId);

      expect(accountService.findByUserId).toHaveBeenCalledWith(senderUserId);
      expect(accountService.debit).toHaveBeenCalledWith(mockSenderAccount.id, Money.fromCents(amountInCents));
      expect(pixTransactionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: transactionId,
        status: SagaState.DEBIT_SUCCESS,
      }));
      expect(sagaLogRepository.save).toHaveBeenCalledTimes(2); // PENDING e DEBIT_SUCCESS
      expect(result.status).toEqual(SagaState.DEBIT_SUCCESS);
    });

    it('não deve processar se a transação não for encontrada', async () => {
      jest.spyOn(pixTransactionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.processPixTransaction(transactionId)).rejects.toThrow(NotFoundException);
      expect(accountService.findByUserId).not.toHaveBeenCalled();
    });

    it('não deve processar se o saldo for insuficiente', async () => {
      jest.spyOn(pixTransactionRepository, 'findOne').mockResolvedValue(mockPendingPixTransaction);
      jest.spyOn(accountService, 'findByUserId').mockResolvedValue({
        ...mockSenderAccount,
        balance: Money.fromCents(1000), // Saldo insuficiente
      });
      jest.spyOn(accountService, 'debit').mockImplementation(() => {
        throw new ConflictException('Insufficient funds.');
      });
      jest.spyOn(pixTransactionRepository, 'save').mockResolvedValue({ ...mockPendingPixTransaction, status: SagaState.DEBIT_FAILED }); // Mock para salvar o status de falha
      jest.spyOn(sagaLogRepository, 'save').mockResolvedValue({ /* mock */ });


      await expect(service.processPixTransaction(transactionId)).rejects.toThrow(ConflictException);
      expect(accountService.debit).toHaveBeenCalled();
      expect(pixTransactionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: transactionId,
        status: SagaState.DEBIT_FAILED,
      }));
      expect(sagaLogRepository.save).toHaveBeenCalledTimes(2); // PENDING e DEBIT_FAILED
    });

    it('não deve processar se a transação já estiver finalizada', async () => {
      jest.spyOn(pixTransactionRepository, 'findOne').mockResolvedValue({
        ...mockPendingPixTransaction,
        status: SagaState.COMPLETED,
      });

      await expect(service.processPixTransaction(transactionId)).rejects.toThrow(BadRequestException);
    });

    // Don Paulo: E se o debitar na conta do sender falhar por um erro inesperado?
    it('deve registrar falha se o débito falhar por erro interno', async () => {
        jest.spyOn(pixTransactionRepository, 'findOne').mockResolvedValue(mockPendingPixTransaction);
        jest.spyOn(accountService, 'findByUserId').mockResolvedValue(mockSenderAccount);
        jest.spyOn(accountService, 'debit').mockImplementation(() => {
            throw new InternalServerErrorException('Simulated DB connection error.');
        });
        jest.spyOn(pixTransactionRepository, 'save').mockResolvedValue({ ...mockPendingPixTransaction, status: SagaState.DEBIT_FAILED });
        jest.spyOn(sagaLogRepository, 'create').mockReturnValue({ /* mock */ });
        jest.spyOn(sagaLogRepository, 'save').mockResolvedValue({ /* mock */ });

        await expect(service.processPixTransaction(transactionId)).rejects.toThrow(InternalServerErrorException);
        expect(pixTransactionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            id: transactionId,
            status: SagaState.DEBIT_FAILED,
        }));
        expect(sagaLogRepository.save).toHaveBeenCalledTimes(2); // PENDING e DEBIT_FAILED
    });
  });
});
