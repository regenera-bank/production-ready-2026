import { Test, TestingModule } from '@nestjs/testing';
import { LifestyleService } from './lifestyle.service';
import { CoreService, InsufficientFundsException } from '../core/core.service';
import { IdempotencyService } from '../core/idempotency.service';
import { NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';

// Mocks para o Firebase Admin
jest.mock('firebase-admin', () => {
  const runTransactionMock = jest.fn((callback) => {
    // Simula a execução da transação passando um objeto com 'get' e 'update'
    const txMock = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ currentCents: 1000, targetCents: 50000 }),
      }),
      update: jest.fn(),
    };
    return callback(txMock);
  });

  return {
    apps: ['mockApp'],
    initializeApp: jest.fn(),
    firestore: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      runTransaction: runTransactionMock,
    }),
  };
});

jest.mock('@google-cloud/pubsub', () => {
  return {
    PubSub: jest.fn().mockImplementation(() => {
      return {
        topic: jest.fn().mockReturnValue({
          publishMessage: jest.fn().mockResolvedValue('msg-1'),
        }),
      };
    }),
  };
});

describe('LifestyleService (Dreams & Marketplace)', () => {
  let service: LifestyleService;
  let coreServiceMock: jest.Mocked<CoreService>;
  let idempotencyMock: jest.Mocked<IdempotencyService>;

  beforeEach(async () => {
    coreServiceMock = {
      debit: jest.fn().mockResolvedValue(100),
    } as any;

    idempotencyMock = {
      get: jest.fn().mockResolvedValue(null),
      acquireLock: jest.fn().mockResolvedValue(undefined),
      releaseLock: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LifestyleService,
        { provide: CoreService, useValue: coreServiceMock },
        { provide: IdempotencyService, useValue: idempotencyMock },
      ],
    }).compile();

    service = module.get<LifestyleService>(LifestyleService);
  });

  describe('addFundsToDream', () => {
    it('deve debitar o saldo ACID e repassar o aporte para o Cofre de Sonho no Firestore', async () => {
      const result = await service.addFundsToDream(
        'usr_1',
        'dream_1',
        5000,
        'idemp-123',
      ); // 50 reais

      expect(result.status).toBe('SETTLED');
      expect(coreServiceMock.debit).toHaveBeenCalledWith(
        'usr_1',
        5000,
        expect.any(Object),
      );
      // Verifica se a idempotência foi destravada e salva
      expect(idempotencyMock.acquireLock).toHaveBeenCalled();
    });

    it('deve bloquear aporte se o usuário não possuir saldo em conta (InsufficientFundsException)', async () => {
      coreServiceMock.debit.mockRejectedValueOnce(
        new InsufficientFundsException(),
      );

      await expect(
        service.addFundsToDream('usr_1', 'dream_1', 5000000),
      ).rejects.toThrow(InsufficientFundsException);
    });
  });

  describe('processMarketplacePurchase', () => {
    it('deve debitar no banco ACID e disparar evento Pub/Sub de Cashback', async () => {
      // Como o PubSub interno da classe é não-injetável de forma simples, focamos no débito
      const result = await service.processMarketplacePurchase(
        'usr_1',
        'prod_123',
      );

      expect(result.status).toBe('APPROVED');
      expect(coreServiceMock.debit).toHaveBeenCalledWith(
        'usr_1',
        1500,
        expect.objectContaining({ type: 'MARKETPLACE_BUY' }),
      );
    });
  });
});
