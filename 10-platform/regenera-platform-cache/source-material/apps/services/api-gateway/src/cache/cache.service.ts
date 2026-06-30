/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: API Gateway - Cache Service
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/api-gateway/src/cache/cache.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    this.redisClient = new Redis({ host, port });

    this.redisClient.on('connect', () => console.log('Redis connected!'));
    this.redisClient.on('error', (err) => console.error('Redis error:', err));
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttlSeconds) {
      await this.redisClient.setex(key, ttlSeconds, data);
    } else {
      await this.redisClient.set(key, data);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
