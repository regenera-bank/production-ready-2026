/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Card Service - Unit Tests
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/card-service/src/card/card.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardService } from './card.service';
import { Card, CardStatus } from './card.entity';
import { NotFoundException } from '@nestjs/common';

const mockCardRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('CardService (Unit)', () => {
  let service: CardService;
  let cardRepository: Repository<Card>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardService,
        {
          provide: getRepositoryToken(Card),
          useFactory: mockCardRepository,
        },
      ],
    }).compile();

    service = module.get<CardService>(CardService);
    cardRepository = module.get<Repository<Card>>(getRepositoryToken(Card));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new card', async () => {
      const createCardDto = { userId: 'user123', type: 'Credit', issuer: 'Regenera' };
      const mockCard = { ...createCardDto, id: 'card123', cardNumber: '1234', expirationDate: '12/29', status: CardStatus.ACTIVE };
      
      (cardRepository.create as jest.Mock).mockReturnValue(mockCard);
      (cardRepository.save as jest.Mock).mockResolvedValue(mockCard);

      const result = await service.create(createCardDto);
      expect(result).toEqual(mockCard);
      expect(cardRepository.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user123' }));
      expect(cardRepository.save).toHaveBeenCalledWith(mockCard);
    });
  });

  describe('findByUserId', () => {
    it('should return an array of cards for a given user ID', async () => {
      const mockCards = [{ id: 'card1', userId: 'user123' }, { id: 'card2', userId: 'user123' }];
      (cardRepository.find as jest.Mock).mockResolvedValue(mockCards);

      const result = await service.findByUserId('user123');
      expect(result).toEqual(mockCards);
      expect(cardRepository.find).toHaveBeenCalledWith({ where: { userId: 'user123' } });
    });

    it('should return an empty array if no cards are found', async () => {
      (cardRepository.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findByUserId('nonexistent-user');
      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update the status of a card', async () => {
      const mockCard = { id: 'card123', userId: 'user123', status: CardStatus.ACTIVE };
      (cardRepository.findOne as jest.Mock).mockResolvedValue(mockCard);
      (cardRepository.save as jest.Mock).mockResolvedValue({ ...mockCard, status: CardStatus.BLOCKED });

      const result = await service.updateStatus('card123', 'user123', CardStatus.BLOCKED);
      expect(result.status).toBe(CardStatus.BLOCKED);
      expect(cardRepository.findOne).toHaveBeenCalledWith({ where: { id: 'card123', userId: 'user123' } });
      expect(cardRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: CardStatus.BLOCKED }));
    });

    it('should throw NotFoundException if card not found for user', async () => {
      (cardRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.updateStatus('nonexistent-card', 'user123', CardStatus.BLOCKED)).rejects.toThrow(NotFoundException);
    });
  });
});
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
