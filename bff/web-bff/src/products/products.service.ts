import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CardsService } from '@regenera/cards';
import { InvestmentsService } from '@regenera/investments';
import { HomologStoreService } from '../persistence/homolog-store.service';
import type {
  ActivationStatusDto,
  CardDto,
  CardInvoiceDto,
  CardTransactionDto,
  InvestmentCatalogItemDto,
  InvestmentOrderDto,
  InvestmentPositionDto,
  SuitabilityDto,
} from './products.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly cards: CardsService,
    private readonly investments: InvestmentsService,
    private readonly store: HomologStoreService,
  ) {}

  async listCards(userId: string): Promise<CardDto[]> {
    const result = await this.cards.execute({
      idempotencyKey: `list-${userId}`,
      principalId: userId,
      payload: { action: 'list_cards' },
    });
    this.audit('cards', userId, 'list_cards', result);
    if (result.status !== 'ACCEPTED') {
      throw new BadRequestException('Falha ao listar cartões');
    }
    return (result.metadata?.cards as CardDto[]) ?? [];
  }

  async blockCard(userId: string, cardId: string, idempotencyKey: string): Promise<CardDto> {
    const result = await this.cards.execute({
      idempotencyKey,
      principalId: userId,
      payload: { action: 'block_card', cardId },
    });
    this.audit('cards', userId, 'block_card', result);
    return this.extractCard(result);
  }

  async unblockCard(userId: string, cardId: string, idempotencyKey: string): Promise<CardDto> {
    const result = await this.cards.execute({
      idempotencyKey,
      principalId: userId,
      payload: { action: 'unblock_card', cardId },
    });
    this.audit('cards', userId, 'unblock_card', result);
    return this.extractCard(result);
  }

  async updateCardLimit(
    userId: string,
    cardId: string,
    limitCents: string,
    idempotencyKey: string,
  ): Promise<CardDto> {
    const result = await this.cards.execute({
      idempotencyKey,
      principalId: userId,
      payload: { action: 'update_limit', cardId, limitCents },
    });
    this.audit('cards', userId, 'update_limit', result);
    return this.extractCard(result);
  }

  async getCardInvoice(userId: string, cardId: string): Promise<CardInvoiceDto> {
    const result = await this.cards.execute({
      idempotencyKey: `invoice-${userId}-${cardId}`,
      principalId: userId,
      payload: { action: 'get_invoice', cardId },
    });
    this.audit('cards', userId, 'get_invoice', result);
    if (result.status !== 'ACCEPTED') {
      throw new BadRequestException('Fatura indisponível');
    }
    return result.metadata?.invoice as CardInvoiceDto;
  }

  async listCardTransactions(userId: string, cardId: string): Promise<CardTransactionDto[]> {
    const result = await this.cards.execute({
      idempotencyKey: `tx-${userId}-${cardId}`,
      principalId: userId,
      payload: { action: 'list_transactions', cardId },
    });
    this.audit('cards', userId, 'list_transactions', result);
    return (result.metadata?.items as CardTransactionDto[]) ?? [];
  }

  async createVirtualCard(
    userId: string,
    limitCents: string,
    idempotencyKey: string,
  ): Promise<CardDto> {
    const result = await this.cards.execute({
      idempotencyKey,
      principalId: userId,
      payload: { action: 'create_virtual_card', limitCents },
    });
    this.audit('cards', userId, 'create_virtual_card', result);
    return this.extractCard(result);
  }

  async cardsActivationStatus(userId: string): Promise<ActivationStatusDto> {
    const result = await this.cards.execute({
      idempotencyKey: `activation-cards-${userId}`,
      principalId: userId,
      payload: { action: 'activation_status' },
    });
    return {
      externalProviderActive: Boolean(result.metadata?.externalProviderActive),
      message: String(result.metadata?.message ?? ''),
      sandbox: Boolean(result.metadata?.sandbox),
    };
  }

  async getSuitability(userId: string): Promise<SuitabilityDto> {
    const result = await this.investments.execute({
      idempotencyKey: `suitability-${userId}`,
      principalId: userId,
      payload: { action: 'get_suitability' },
    });
    this.audit('investments', userId, 'get_suitability', result);
    return (result.metadata?.suitability as SuitabilityDto) ?? { suitability: 'moderate', score: 0 };
  }

  async getInvestmentCatalog(userId: string): Promise<InvestmentCatalogItemDto[]> {
    const result = await this.investments.execute({
      idempotencyKey: `catalog-${userId}`,
      principalId: userId,
      payload: { action: 'get_catalog' },
    });
    this.audit('investments', userId, 'get_catalog', result);
    return (result.metadata?.catalog as InvestmentCatalogItemDto[]) ?? [];
  }

  async getInvestmentPositions(userId: string): Promise<InvestmentPositionDto[]> {
    const result = await this.investments.execute({
      idempotencyKey: `positions-${userId}`,
      principalId: userId,
      payload: { action: 'get_position' },
    });
    this.audit('investments', userId, 'get_position', result);
    return (result.metadata?.positions as InvestmentPositionDto[]) ?? [];
  }

  async placeInvestmentOrder(
    userId: string,
    productId: string,
    amountCents: string,
    idempotencyKey: string,
  ): Promise<InvestmentOrderDto> {
    const result = await this.investments.execute({
      idempotencyKey,
      principalId: userId,
      payload: { action: 'place_order', productId, amountCents },
    });
    this.audit('investments', userId, 'place_order', result);
    if (result.status !== 'ACCEPTED') {
      throw new BadRequestException(String(result.metadata?.reason ?? 'Ordem rejeitada'));
    }
    return result.metadata?.order as InvestmentOrderDto;
  }

  async listInvestmentOrders(userId: string): Promise<InvestmentOrderDto[]> {
    const result = await this.investments.execute({
      idempotencyKey: `history-${userId}`,
      principalId: userId,
      payload: { action: 'list_history' },
    });
    this.audit('investments', userId, 'list_history', result);
    return (result.metadata?.orders as InvestmentOrderDto[]) ?? [];
  }

  async investmentsActivationStatus(userId: string): Promise<ActivationStatusDto> {
    const result = await this.investments.execute({
      idempotencyKey: `activation-inv-${userId}`,
      principalId: userId,
      payload: { action: 'activation_status' },
    });
    return {
      externalProviderActive: Boolean(result.metadata?.externalProviderActive),
      message: String(result.metadata?.message ?? ''),
      sandbox: Boolean(result.metadata?.sandbox),
    };
  }

  private extractCard(result: { status: string; metadata?: Record<string, unknown> }): CardDto {
    if (result.status !== 'ACCEPTED' || !result.metadata?.card) {
      throw new BadRequestException(String(result.metadata?.reason ?? 'Operação de cartão rejeitada'));
    }
    return result.metadata.card as CardDto;
  }

  private audit(
    domain: 'cards' | 'investments',
    userId: string,
    action: string,
    result: { referenceId: string; status: string },
  ): void {
    this.store.mutate((draft) => {
      if (!draft.products) {
        draft.products = { audit: [] };
      }
      draft.products.audit.push({
        id: randomUUID(),
        domain,
        userId,
        action,
        referenceId: result.referenceId,
        status: result.status,
        at: new Date().toISOString(),
      });
    });
  }
}