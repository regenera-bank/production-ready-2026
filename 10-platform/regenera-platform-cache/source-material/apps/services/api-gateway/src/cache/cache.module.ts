/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: API Gateway - Cache Module
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/api-gateway/src/cache/cache.module.ts
import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { ConfigModule } from '@nestjs/config';

@Global() // Make CacheService available everywhere
@Module({
  imports: [ConfigModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
