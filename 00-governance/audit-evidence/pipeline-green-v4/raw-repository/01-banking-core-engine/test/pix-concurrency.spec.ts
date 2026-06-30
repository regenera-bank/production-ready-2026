/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

import { Test, TestingModule } from '@nestjs/testing';
import { PixService } from '../src/core/pix.service';
import { IdempotencyService } from '../src/core/idempotency.service';
import { CoreService } from '../src/core/core.service';
import { PixEventsGateway } from '../src/core/pix.gateway';
import { PixKeyEntity } from '../src/core/entities/pix-key.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { AccountEntity } from '../src/core/entities/account.entity';
import { MetricsService } from '../src/metrics/metrics.service';
import { TracingService } from '../src/infra/tracing/tracing.service';

describe('Pix Concurrency & Idempotency Test', () => {
  let pixService: PixService;
  let idempotencyService: IdempotencyService;

  beforeAll(async () => {
    let locked = false;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: MetricsService,
          useValue: {
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
          },
        },
        {
          provide: IdempotencyService,
          useValue: {
            acquireLock: jest.fn().mockImplementation(async () => {
              if (locked)
                throw new ConflictException(
                  'Transação já processada ou em andamento.',
                );
              locked = true;
            }),
            get: jest.fn().mockResolvedValue(null),
            save: jest.fn(),
            releaseLock: jest.fn(),
          },
        },
        {
          provide: CoreService,
          useValue: {
            executePixAtomic: jest
              .fn()
              .mockResolvedValue({ senderNewBalance: 1000 }),
          },
        },
        {
          provide: PixEventsGateway,
          useValue: {
            broadcastPixEvent: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PixKeyEntity),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AccountEntity),
          useValue: {},
        },
        {
          provide: TracingService,
          useValue: { startSpan: jest.fn(), endSpan: jest.fn() },
        },
        PixService,
      ],
    }).compile();

    pixService = module.get<PixService>(PixService);
    idempotencyService = module.get<IdempotencyService>(IdempotencyService);
  });

  it('deve processar apenas 1 transação PIX com sucesso e rejeitar 9 (409 Conflict)', async () => {
    const idempotencyKey = `pix-test-key-${Date.now()}`;
    const neuralId = 'TEST-USER-123';

    const promises = Array.from({ length: 10 }).map(() =>
      pixService
        .executePix(neuralId, 'receiver@test.com', 100, idempotencyKey)
        .then(() => 'SUCCESS')
        .catch((err) => {
          if (err instanceof ConflictException) {
            return 'CONFLICT';
          }
          return 'OTHER_ERROR';
        }),
    );

    const results = await Promise.all(promises);

    const successes = results.filter((r) => r === 'SUCCESS').length;
    const conflicts = results.filter((r) => r === 'CONFLICT').length;

    expect(successes).toBe(1);
    expect(conflicts).toBe(9);
  });
});
