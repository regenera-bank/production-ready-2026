import { randomUUID } from 'crypto';
import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { SessionRecord } from '../auth/auth.service';
import { ProductsService } from './products.service';

type AuthedRequest = Request & { session: SessionRecord };

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('cards')
  @UseGuards(SessionGuard)
  listCards(@Req() req: AuthedRequest) {
    return this.products.listCards(req.session.userId);
  }

  /** Pontos do programa Regenera — regra única server-side (§17/§30). */
  @Get('rewards')
  @UseGuards(SessionGuard)
  rewards(@Req() req: AuthedRequest) {
    return this.products.getRewards(req.session.userId);
  }

  @Post('cards/:cardId/block')
  @UseGuards(SessionGuard)
  blockCard(
    @Req() req: AuthedRequest,
    @Param('cardId') cardId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.products.blockCard(
      req.session.userId,
      cardId,
      idempotencyKey ?? `block-${randomUUID()}`,
    );
  }

  @Post('cards/:cardId/unblock')
  @UseGuards(SessionGuard)
  unblockCard(
    @Req() req: AuthedRequest,
    @Param('cardId') cardId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.products.unblockCard(
      req.session.userId,
      cardId,
      idempotencyKey ?? `unblock-${randomUUID()}`,
    );
  }

  @Post('cards/:cardId/limit')
  @UseGuards(SessionGuard)
  updateLimit(
    @Req() req: AuthedRequest,
    @Param('cardId') cardId: string,
    @Body() body: { limitCents: string },
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.products.updateCardLimit(
      req.session.userId,
      cardId,
      body.limitCents,
      idempotencyKey ?? `limit-${randomUUID()}`,
    );
  }

  @Get('cards/:cardId/invoice')
  @UseGuards(SessionGuard)
  getInvoice(@Req() req: AuthedRequest, @Param('cardId') cardId: string) {
    return this.products.getCardInvoice(req.session.userId, cardId);
  }

  @Get('cards/:cardId/transactions')
  @UseGuards(SessionGuard)
  listCardTransactions(@Req() req: AuthedRequest, @Param('cardId') cardId: string) {
    return this.products.listCardTransactions(req.session.userId, cardId);
  }

  @Post('cards/issue')
  @UseGuards(SessionGuard)
  issueCard(
    @Req() req: AuthedRequest,
    @Body() body: { alias?: string; limitCents?: string },
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.products.issueCard(
      req.session.userId,
      body.alias ?? 'Regenera Crédito',
      body.limitCents ?? '300000',
      idempotencyKey ?? `issue-${randomUUID()}`,
    );
  }

  @Post('cards/:cardId/authorize')
  @UseGuards(SessionGuard)
  authorize(
    @Req() req: AuthedRequest,
    @Param('cardId') cardId: string,
    @Body() body: { amountCents: string; merchant: string },
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.products.authorizePurchase(
      req.session.userId,
      cardId,
      body.amountCents,
      body.merchant,
      idempotencyKey ?? `auth-${randomUUID()}`,
    );
  }

  @Post('cards/:cardId/capture/:authId')
  @UseGuards(SessionGuard)
  capture(
    @Req() req: AuthedRequest,
    @Param('cardId') cardId: string,
    @Param('authId') authId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.products.capturePurchase(
      req.session.userId,
      cardId,
      authId,
      idempotencyKey ?? `capture-${randomUUID()}`,
    );
  }

  @Post('cards/:cardId/reverse/:authId')
  @UseGuards(SessionGuard)
  reverse(
    @Req() req: AuthedRequest,
    @Param('cardId') cardId: string,
    @Param('authId') authId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.products.reversePurchase(
      req.session.userId,
      cardId,
      authId,
      idempotencyKey ?? `reverse-${randomUUID()}`,
    );
  }

  @Post('cards/virtual')
  @UseGuards(SessionGuard)
  createVirtual(
    @Req() req: AuthedRequest,
    @Body() body: { limitCents?: string },
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.products.createVirtualCard(
      req.session.userId,
      body.limitCents ?? '50000',
      idempotencyKey ?? `virtual-${randomUUID()}`,
    );
  }

  @Get('cards/activation')
  @UseGuards(SessionGuard)
  cardsActivation(@Req() req: AuthedRequest) {
    return this.products.cardsActivationStatus(req.session.userId);
  }

  @Get('investments/suitability')
  @UseGuards(SessionGuard)
  suitability(@Req() req: AuthedRequest) {
    return this.products.getSuitability(req.session.userId);
  }

  @Get('investments/catalog')
  @UseGuards(SessionGuard)
  catalog(@Req() req: AuthedRequest) {
    return this.products.getInvestmentCatalog(req.session.userId);
  }

  @Get('investments/positions')
  @UseGuards(SessionGuard)
  positions(@Req() req: AuthedRequest) {
    return this.products.getInvestmentPositions(req.session.userId);
  }

  @Post('investments/orders')
  @UseGuards(SessionGuard)
  placeOrder(
    @Req() req: AuthedRequest,
    @Body() body: { productId: string; amountCents: string },
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.products.placeInvestmentOrder(
      req.session.userId,
      body.productId,
      body.amountCents,
      idempotencyKey ?? `order-${randomUUID()}`,
    );
  }

  @Get('investments/orders')
  @UseGuards(SessionGuard)
  listOrders(@Req() req: AuthedRequest) {
    return this.products.listInvestmentOrders(req.session.userId);
  }

  @Get('investments/activation')
  @UseGuards(SessionGuard)
  investmentsActivation(@Req() req: AuthedRequest) {
    return this.products.investmentsActivationStatus(req.session.userId);
  }

  @Get('credit/offers')
  @UseGuards(SessionGuard)
  creditOffers(@Req() req: AuthedRequest) {
    return this.products.getCreditOffers(req.session.userId);
  }

  @Post('cards/:cardId/chargeback/:authId')
  @UseGuards(SessionGuard)
  chargeback(
    @Req() req: AuthedRequest,
    @Param('cardId') cardId: string,
    @Param('authId') authId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.products.chargebackPurchase(
      req.session.userId,
      cardId,
      authId,
      idempotencyKey ?? `chargeback-${randomUUID()}`,
    );
  }
}