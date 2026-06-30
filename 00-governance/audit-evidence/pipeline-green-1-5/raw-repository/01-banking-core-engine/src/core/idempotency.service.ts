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

import {
  Injectable,
  ConflictException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class IdempotencyService implements OnModuleDestroy {
  private redis!: Redis;
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly metricsService: MetricsService) {
    try {
      if (process.env.NODE_ENV === 'test') {
        const store = new Map<string, string>();
        this.redis = {
          on: () => {},
          quit: () => {},
          exists: async (k: string) => (store.has(k) ? 1 : 0),
          get: async (k: string) => store.get(k) || null,
          set: async (k: string, v: string) => {
            store.set(k, v);
            return 'OK';
          },
          del: async (k: string) => {
            const existed = store.has(k);
            store.delete(k);
            return existed ? 1 : 0;
          },
        } as any;
      } else {
        this.redis = new Redis(
          process.env.REDIS_URL || 'redis://localhost:6379',
          {
            maxRetriesPerRequest: 3,
            connectTimeout: 5000,
          },
        );
        this.redis.on('error', (err) => {
          this.metricsService.incrementRedisUnavailable();
          this.logger.error(
            `Redis connection error. Idempotency is severely degraded: ${err.message}`,
          );
        });
      }
    } catch (e) {
      this.metricsService.incrementRedisUnavailable();
      this.logger.error(
        'Failed to initialize Redis. System cannot guarantee idempotency without it.',
      );
      throw new Error('Critical: Redis Initialization Failed');
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      this.redis.quit();
    }
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(`idempotency_result:${key}`);
    return result === 1;
  }

  async lock(key: string): Promise<void> {
    return this.acquireLock(key, 'system');
  }

  async acquireLock(key: string, neuralId: string): Promise<void> {
    const lockKey = `idempotency_lock:${neuralId}:${key}`;
    const result = await this.redis.set(lockKey, 'LOCKED', 'EX', 60, 'NX');
    if (!result) {
      this.metricsService.incrementIdempotencyLockConflict();
      this.logger.warn(`Idempotency lock failed for key: ${key}`);
      throw new ConflictException('Transação já processada ou em andamento.');
    }
  }

  async unlock(key: string): Promise<void> {
    return this.releaseLock(key, 'system');
  }

  async releaseLock(key: string, neuralId: string): Promise<void> {
    const lockKey = `idempotency_lock:${neuralId}:${key}`;
    if (this.redis && typeof this.redis.del === 'function') {
      await this.redis.del(lockKey);
    } else if (this.redis) {
      // fallback for incomplete mocks
      (this.redis as any).del = async () => 1;
    }
  }

  async get(key: string, neuralId?: string): Promise<any | null> {
    const logKey = neuralId
      ? `idempotency_result:${neuralId}:${key}`
      : `idempotency_result:${key}`;
    const log = await this.redis.get(logKey);
    return log ? JSON.parse(log) : null;
  }

  async save(
    key: string,
    param2: any,
    param3?: any,
    param4?: any,
    param5?: any,
  ): Promise<void> {
    // Handling overloaded signature:
    // save(key, body) OR save(key, neuralId, endpoint, status, body)
    const isOverloaded = param3 !== undefined;
    const logKey = isOverloaded
      ? `idempotency_result:${param2}:${key}`
      : `idempotency_result:${key}`;
    const body = isOverloaded ? param5 : param2;
    const status = isOverloaded ? param4 : 200;

    const payload = JSON.stringify(
      isOverloaded ? { status, body } : { payload: body },
    );
    // Keep idempotency result for 24 hours
    await this.redis.set(logKey, payload, 'EX', 86400);
  }
}
