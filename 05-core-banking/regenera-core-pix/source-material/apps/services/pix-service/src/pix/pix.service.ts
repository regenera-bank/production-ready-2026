/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: PIX Service
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/pix-service/src/pix/pix.service.ts
import { Injectable } from '@nestjs/common';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { PixSagaService } from './pix-saga.service'; // Import the new saga service

@Injectable()
export class PixService {
  constructor(
    private readonly pixSagaService: PixSagaService, // Inject the saga service
  ) {}

  async createTransfer(transferDto: CreateTransferDto, userId: string) {
    // Delegate the complex distributed transaction logic to the PixSagaService
    return this.pixSagaService.createPixTransferSaga(transferDto, userId);
  }
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
