import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CardsService } from '@regenera/cards';
import { InvestmentsService } from '@regenera/investments';

import { BankingService } from '../banking/banking.service';
import { ChannelAncillaryService } from '@regenera/channel-persistence';
import type {
  ActivationStatusDto,
  CardAuthorizationDto,
  CardDto,
  CardInvoiceDto,
  CardTransactionDto,
  InvestmentCatalogItemDto,
  InvestmentOrderDto,
  InvestmentPositionDto,
  RewardsDto,
  SuitabilityDto,
} from './products.dto';

/** Regra do programa de pontos — v1, única para todos os canais. */
const REWARDS_PROGRAM_VERSION = 'regenera-rewards-v1';
const REWARDS_TIERS: ReadonlyArray<{ tier: RewardsDto['tier']; minPoints: number }> = [
  { tier: 'FLORESTA', minPoints: 10_000 },
  { tier: 'COPA', minPoints: 2_500 },
  { tier: 'RAIZ', minPoints: 500 },
  { tier: 'SEMENTE', minPoints: 0 },
];

@Injectable()
export class ProductsService {
  constructor(
    private readonly cards: CardsService,
    private readonly investments: InvestmentsService,
    private readonly ancillary: ChannelAncillaryService,
    @Inject(forwardRef(() => BankingService))
    private readonly banking: BankingService,
  ) {}

  async listCards(userId: string): Promise<CardDto[]> {
    const result = await this.cards.execute({
      idempotencyKey: `list-${userId}`,
      principalId: userId,
      payload: { action: 'list_cards' },
    });
    this.Audit('cards', userId, 'list_cards', result);
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
    this.Audit('cards', userId, 'block_card', result);
    return this.extractCard(result);
  }

  async unblockCard(userId: string, cardId: string, idempotencyKey: string): Promise<CardDto> {
    const result = await this.cards.execute({
      idempotencyKey,
      principalId: userId,
      payload: { action: 'unblock_card', cardId },
    });
    this.Audit('cards', userId, 'unblock_card', result);
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
    this.Audit('cards', userId, 'update_limit', result);
    return this.extractCard(result);
  }

  async getCardInvoice(userId: string, cardId: string): Promise<CardInvoiceDto> {
    const result = await this.cards.execute({
      idempotencyKey: `invoice-${userId}-${cardId}`,
      principalId: userId,
      payload: { action: 'get_invoice', cardId },
    });
    this.Audit('cards', userId, 'get_invoice', result);
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
    this.Audit('cards', userId, 'list_transactions', result);
    return (result.metadata?.items as CardTransactionDto[]) ?? [];
  }

  async issueCard(
    userId: string,
    alias: string,
    limitCents: string,
    idempotencyKey: string,
  ): Promise<CardDto> {
    const result = await this.cards.execute({
      idempotencyKey,
      principalId: userId,
      payload: { action: 'issue_card', alias, limitCents },
    });
    this.Audit('cards', userId, 'issue_card', result);
    return this.extractCard(result);
  }

  async authorizePurchase(
    userId: string,
    cardId: string,
    amountCents: string,
    merchant: string,
    idempotencyKey: string,
  ): Promise<CardAuthorizationDto> {
    const result = await this.cards.execute({
      idempotencyKey,
      principalId: userId,
      payload: { action: 'authorize_purchase', cardId, amountCents, merchant },
    });
    this.Audit('cards', userId, 'authorize_purchase', result);
    if (result.status !== 'ACCEPTED' || !result.metadata?.authorization) {
      throw new BadRequestException(String(result.metadata?.reason ?? 'Autorização negada'));
    }
    return result.metadata.authorization as CardAuthorizationDto;
  }

  async capturePurchase(
    userId: string,
    cardId: string,
    authId: string,
    idempotencyKey: string,
  ): Promise<CardTransactionDto> {
    const result = await this.cards.execute({
      idempotencyKey,
      principalId: userId,
      payload: { action: 'capture_purchase', cardId, authId },
    });
    this.Audit('cards', userId, 'capture_purchase', result);
    if (result.status !== 'ACCEPTED' || !result.metadata?.transaction) {
      throw new BadRequestException(String(result.metadata?.reason ?? 'Captura negada'));
    }
    const tx = result.metadata.transaction as CardTransactionDto;
    const amountCents = BigInt(tx.amountCents);
    try {
      const ledger = await this.banking.settleCardCapture(
        userId,
        amountCents,
        idempotencyKey,
        tx.title,
        tx.id,
      );
      return { ...tx, ledgerPaymentId: ledger.paymentId, balanceCents: ledger.balanceCents };
    } catch (error) {
      await this.compensateCardCapture(userId, cardId, authId, idempotencyKey);
      throw error;
    }
  }

  async reversePurchase(
    userId: string,
    cardId: string,
    authId: string,
    idempotencyKey: string,
  ): Promise<CardTransactionDto> {
    const result = await this.cards.execute({
      idempotencyKey,
      principalId: userId,
      payload: { action: 'reverse_purchase', cardId, authId },
    });
    this.Audit('cards', userId, 'reverse_purchase', result);
    if (result.status !== 'ACCEPTED' || !result.metadata?.transaction) {
      throw new BadRequestException(String(result.metadata?.reason ?? 'Estorno negado'));
    }
    const tx = result.metadata.transaction as CardTransactionDto;
    const rawAmount = tx.amountCents.startsWith('-')
      ? tx.amountCents.slice(1)
      : tx.amountCents;
    const ledger = await this.banking.creditCardReversal(
      userId,
      BigInt(rawAmount),
      idempotencyKey,
      tx.title.replace(/^Estorno — /, ''),
      tx.id,
    );
    return { ...tx, ledgerPaymentId: ledger.paymentId, balanceCents: ledger.balanceCents };
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
    this.Audit('cards', userId, 'create_virtual_card', result);
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
    this.Audit('investments', userId, 'get_suitability', result);
    return (result.metadata?.suitability as SuitabilityDto) ?? { suitability: 'moderate', score: 0 };
  }

  async getInvestmentCatalog(userId: string): Promise<InvestmentCatalogItemDto[]> {
    const result = await this.investments.execute({
      idempotencyKey: `catalog-${userId}`,
      principalId: userId,
      payload: { action: 'get_catalog' },
    });
    this.Audit('investments', userId, 'get_catalog', result);
    return (result.metadata?.catalog as InvestmentCatalogItemDto[]) ?? [];
  }

  async getInvestmentPositions(userId: string): Promise<InvestmentPositionDto[]> {
    const result = await this.investments.execute({
      idempotencyKey: `positions-${userId}`,
      principalId: userId,
      payload: { action: 'get_position' },
    });
    this.Audit('investments', userId, 'get_position', result);
    return (result.metadata?.positions as InvestmentPositionDto[]) ?? [];
  }

  async placeInvestmentOrder(
    userId: string,
    productId: string,
    amountCents: string,
    idempotencyKey: string,
  ): Promise<InvestmentOrderDto> {
    const catalog = await this.getInvestmentCatalog(userId);
    const product = catalog.find((item) => item.id === productId);
    if (!product) {
      throw new BadRequestException('Produto não encontrado');
    }
    const ledger = await this.banking.settleInvestmentOrder(
      userId,
      BigInt(amountCents),
      idempotencyKey,
      product.name,
      `inv-pending-${idempotencyKey}`,
    );
    const result = await this.investments.execute({
      idempotencyKey,
      principalId: userId,
      payload: { action: 'place_order', productId, amountCents },
    });
    this.Audit('investments', userId, 'place_order', result);
    if (result.status !== 'ACCEPTED') {
      throw new BadRequestException(String(result.metadata?.reason ?? 'Ordem rejeitada'));
    }
    const order = result.metadata?.order as InvestmentOrderDto;
    return {
      ...order,
      ledgerPaymentId: ledger.paymentId,
      balanceCents: ledger.balanceCents,
    };
  }

  async listInvestmentOrders(userId: string): Promise<InvestmentOrderDto[]> {
    const result = await this.investments.execute({
      idempotencyKey: `history-${userId}`,
      principalId: userId,
      payload: { action: 'list_history' },
    });
    this.Audit('investments', userId, 'list_history', result);
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

  private async compensateCardCapture(
    userId: string,
    cardId: string,
    authId: string,
    idempotencyKey: string,
  ): Promise<void> {
    await this.cards.execute({
      idempotencyKey: `compensate-${idempotencyKey}`,
      principalId: userId,
      payload: { action: 'reverse_purchase', cardId, authId },
    });
  }

  async getCreditOffers(userId: string) {
    this.Audit('investments', userId, 'get_credit_offers', {
      referenceId: `credit-offers-${userId}`,
      status: 'ACCEPTED',
    });
    return [
      {
        id: 'credit-personal-sbx',
        name: 'Crédito Pessoal Sandbox',
        maxAmountCents: '500000',
        ratePct: '1.99',
        sandbox: true,
      },
      {
        id: 'credit-overdraft-sbx',
        name: 'Cheque Especial Sandbox',
        maxAmountCents: '100000',
        ratePct: '2.49',
        sandbox: true,
      },
    ];
  }

  async chargebackPurchase(
    userId: string,
    cardId: string,
    authId: string,
    idempotencyKey: string,
  ) {
    const result = await this.cards.execute({
      idempotencyKey,
      principalId: userId,
      payload: { action: 'chargeback_purchase', cardId, authId },
    });
    this.Audit('cards', userId, 'chargeback_purchase', result);
    if (result.status !== 'ACCEPTED' || !result.metadata?.transaction) {
      throw new BadRequestException(String(result.metadata?.reason ?? 'Chargeback negado'));
    }
    const tx = result.metadata.transaction as CardTransactionDto;
    const rawAmount = tx.amountCents.startsWith('-')
      ? tx.amountCents.slice(1)
      : tx.amountCents;
    const ledger = await this.banking.creditCardReversal(
      userId,
      BigInt(rawAmount),
      idempotencyKey,
      tx.title.replace(/^Chargeback — /, ''),
      tx.id,
    );
    return { ...tx, ledgerPaymentId: ledger.paymentId, balanceCents: ledger.balanceCents };
  }

  /**
   * Pontos Regenera calculados no servidor a partir da projeção de extrato
   * (fonte: outbox/ledger). O canal apenas exibe — nunca calcula (§17).
   * Regra v1: +1 ponto por R$1,00 recebido liquidado; +25 por lançamento.
   */
  async getRewards(userId: string): Promise<RewardsDto> {
    const items = await this.banking.getTransactions(userId);
    const inflowCents = items
      .filter((item) => item.type === 'inflow')
      .reduce((sum, item) => {
        const raw = item.amountCents.replace('-', '');
        return sum + Number(BigInt(raw) / 100n);
      }, 0);
    const inflowPoints = inflowCents; // 1 ponto por R$1,00 recebido
    const activityPoints = items.length * 25;
    const pointsBalance = inflowPoints + activityPoints;

    const current = REWARDS_TIERS.find((t) => pointsBalance >= t.minPoints)!;
    const next = [...REWARDS_TIERS]
      .reverse()
      .find((t) => t.minPoints > pointsBalance);

    return {
      pointsBalance,
      tier: current.tier,
      nextTierAt: next ? next.minPoints : null,
      accruals: [
        { label: 'Valores recebidos (1 pt/R$)', points: inflowPoints },
        { label: `Atividade na conta (${items.length} lançamentos × 25)`, points: activityPoints },
      ],
      programVersion: REWARDS_PROGRAM_VERSION,
      asOf: new Date().toISOString(),
    };
  }

  private Audit(
    domain: 'cards' | 'investments',
    userId: string,
    action: string,
    result: { referenceId: string; status: string },
  ): void {
    void this.ancillary.recordProductsAudit(
      userId,
      action,
      result.referenceId,
      result.status,
      { domain },
    );
  }
}