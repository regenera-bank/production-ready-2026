import { Test, TestingModule } from '@nestjs/testing';
import { PixService } from './pix.service';
import { CoreService } from './core.service';
import { PixEventsGateway } from './pix.gateway';
import { IdempotencyService } from './idempotency.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountEntity } from './entities/account.entity';
import { BadRequestException, HttpException } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';
import { TracingService } from '../infra/tracing/tracing.service';

jest.mock('@google-cloud/pubsub', () => ({
  PubSub: jest.fn().mockImplementation(() => ({
    topic: jest.fn().mockReturnValue({
      publishMessage: jest.fn().mockResolvedValue('msg-1'),
      subscription: jest.fn().mockReturnValue({
        on: jest.fn(),
      }),
    }),
    subscription: jest.fn().mockReturnValue({
      on: jest.fn(),
    }),
  })),
}));

describe('PixService (Unit Tests)', () => {
  let pixService: PixService;
  let coreService: CoreService;
  let idempotencyGuard: IdempotencyService;

  const mockCoreService = {
    executePixAtomic: jest.fn(),
  };

  const mockGateway = {
    broadcastPixEvent: jest.fn(),
  };

  const mockIdempotency = {
    get: jest.fn(),
    acquireLock: jest.fn(),
    save: jest.fn(),
    releaseLock: jest.fn(),
  };

  const mockPixKeyRepo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockMetricsService = {
    incrementPixRequests: jest.fn(),
    incrementPixReplays: jest.fn(),
    incrementPixFailed: jest.fn(),
    incrementLedgerDebit: jest.fn(),
    incrementLedgerCredit: jest.fn(),
    incrementLedgerBalanceDivergence: jest.fn(),
    incrementIdempotencyLockConflict: jest.fn(),
    incrementRedisUnavailable: jest.fn(),
    incrementDbLockTimeout: jest.fn(),
    setReconciliationDuration: jest.fn(),
    recordHttpRequestDuration: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PixService,
        { provide: CoreService, useValue: mockCoreService },
        { provide: PixEventsGateway, useValue: mockGateway },
        { provide: IdempotencyService, useValue: mockIdempotency },
        { provide: getRepositoryToken(AccountEntity), useValue: {} },
        { provide: MetricsService, useValue: mockMetricsService },
        {
          provide: TracingService,
          useValue: { startSpan: jest.fn(), endSpan: jest.fn() },
        },
      ],
    }).compile();

    pixService = module.get<PixService>(PixService);
    coreService = module.get<CoreService>(CoreService);
    idempotencyGuard = module.get<IdempotencyService>(IdempotencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executePix (SPI Outbound)', () => {
    const mockAccountId = 'ACC-123';
    const mockDestKey = '00012345678';

    it('deve rejeitar valores negativos ou nulos (Sanitização)', async () => {
      await expect(
        pixService.executePix(mockAccountId, mockDestKey, -50),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve retornar do cache em caso de repetição de IdempotencyKey (Double-Spend Prevention)', async () => {
      const idempotencyKey = 'UUID-XYZ';
      mockIdempotency.get.mockResolvedValueOnce({
        body: { status: 'SETTLED_SPI', amountProcessedCents: 1000 },
      });

      const result = await pixService.executePix(
        mockAccountId,
        mockDestKey,
        10,
        idempotencyKey,
      );

      expect(result.status).toBe('SETTLED_SPI');
      expect(coreService.executePixAtomic).not.toHaveBeenCalled();
    });

    it('deve barrar transações suspeitas bloqueadas pela AML', async () => {
      // 999900 = R$ 9.999,00 (threshold malicioso definido na constante)
      await expect(
        pixService.executePix(mockAccountId, mockDestKey, 9999),
      ).rejects.toThrow(
        'Transação bloqueada preventivamente pela esteira de segurança.',
      );
    });

    it('deve realizar PIX com sucesso e acionar o CoreService Atômico', async () => {
      const idempotencyKey = 'UUID-NEW';
      mockIdempotency.get.mockResolvedValueOnce(null);
      mockCoreService.executePixAtomic.mockResolvedValueOnce({
        senderNewBalance: 400,
      });

      const result = await pixService.executePix(
        mockAccountId,
        mockDestKey,
        5,
        idempotencyKey,
      );

      expect(mockIdempotency.acquireLock).toHaveBeenCalledWith(
        idempotencyKey,
        mockAccountId,
      );
      expect(mockCoreService.executePixAtomic).toHaveBeenCalled();
      expect(result.status).toBe('SETTLED_SPI');
      expect(result.amount).toBe(500); // 5 reais = 500 centavos
      expect(mockGateway.broadcastPixEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'PIX_OUTBOUND_SUCCESS' }),
      );
    });

    it('deve liberar o lock de idempotência em caso de falha de execução', async () => {
      const idempotencyKey = 'UUID-FAIL';
      mockIdempotency.get.mockResolvedValueOnce(null);
      mockCoreService.executePixAtomic.mockRejectedValueOnce(
        new Error('PostgreSQL Lock Timeout'),
      );

      await expect(
        pixService.executePix(mockAccountId, mockDestKey, 150, idempotencyKey),
      ).rejects.toThrow('PostgreSQL Lock Timeout');

      expect(mockIdempotency.releaseLock).toHaveBeenCalledWith(
        idempotencyKey,
        mockAccountId,
      );
    });
  });
});
