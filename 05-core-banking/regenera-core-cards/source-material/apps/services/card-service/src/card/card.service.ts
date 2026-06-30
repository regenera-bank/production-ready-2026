/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Card Service
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/card-service/src/card/card.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card, CardStatus } from './card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { PaymentGatewayService } from './payment-gateway.service'; // Importar PaymentGatewayService

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly paymentGatewayService: PaymentGatewayService, // Injetar PaymentGatewayService
  ) {}

  async create(createCardDto: CreateCardDto): Promise<Card> {
    // Don Paulo: Antes de qualquer persistência, tokenizamos. PCI-DSS na veia.
    // O cardNumber original nunca deve ser armazenado.
    const tokenizedData = await this.paymentGatewayService.tokenizeCard(
      createCardDto.cardNumber,
      createCardDto.expirationMonth,
      createCardDto.expirationYear,
      createCardDto.cvc,
      createCardDto.cardHolderName,
    );

    const newCard = this.cardRepository.create({
      userId: createCardDto.userId,
      accountId: createCardDto.accountId, // Adicionar accountId, que está no DTO original
      tokenizedCardId: tokenizedData.token,
      last4: tokenizedData.last4,
      brand: tokenizedData.brand,
      cardHolderName: createCardDto.cardHolderName, // Preencher do DTO
      expirationDate: tokenizedData.expirationDate, // Preencher do token
      status: CardStatus.ACTIVE,
      type: createCardDto.type, // Preencher do DTO
    });
    return this.cardRepository.save(newCard);
  }

  async findByUserId(userId: string): Promise<Card[]> {
    return this.cardRepository.find({ where: { userId } });
  }

  async updateStatus(cardId: string, userId: string, status: CardStatus): Promise<Card> {
    const card = await this.cardRepository.findOne({ where: { id: cardId, userId } });
    if (!card) {
      throw new NotFoundException(`Card with ID "${cardId}" not found for this user.`);
    }
    card.status = status;
    return this.cardRepository.save(card);
  }
}/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
