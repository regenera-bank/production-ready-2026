/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: PIX Module
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/pix-service/src/pix/pix.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PixService } from './pix.service';
import { PixController } from './pix.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixTransaction } from './pix-transaction.entity';
import { CentralBankService } from './central-bank.service';
import { PixSagaService } from './pix-saga.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    TypeOrmModule.forFeature([PixTransaction]),
  ],
  providers: [PixService, CentralBankService, PixSagaService],
  controllers: [PixController],
})
export class PixModule {}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
