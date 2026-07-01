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
}