/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Card Module
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/card-service/src/card/card.module.ts
import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './card.entity';
import { PaymentGatewayService } from './payment-gateway.service'; // Importar PaymentGatewayService

@Module({
  imports: [TypeOrmModule.forFeature([Card])],
  providers: [CardService, PaymentGatewayService], // Adicionar PaymentGatewayService
  controllers: [CardController],
  exports: [TypeOrmModule],
})
export class CardModule {}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
