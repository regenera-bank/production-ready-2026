/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - PIX SERVICE
  Module: PIX Transfers

  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky

  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] pix.module.ts

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PixSagaService } from './pix-saga.service';
// Um controller seria criado aqui para expor a SAGA via API
// import { PixController } from './pix.controller';

@Module({
  imports: [
    // Importa o HttpModule para fazer chamadas a outros serviços
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  // controllers: [PixController],
  providers: [PixSagaService],
  exports: [PixSagaService],
})
export class PixModule {}
