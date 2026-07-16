import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IdempotencyInterceptor } from '../common/idempotency.interceptor';
import { PartnerAuthGuard } from '../auth/partner-auth.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { PartnerService } from './partner.service';

@Controller()
@UseGuards(PartnerAuthGuard, ScopesGuard)
export class PartnerController {
  constructor(private readonly partner: PartnerService) {}

  @Get('accounts')
  @RequireScopes('accounts:read')
  listAccounts() {
    return this.partner.listAccounts();
  }

  @Get('accounts/:accountId/balance')
  @RequireScopes('balances:read')
  getBalance(@Param('accountId') accountId: string) {
    return this.partner.getBalance(accountId);
  }

  @Get('accounts/:accountId/transactions')
  @RequireScopes('transactions:read')
  listTransactions(
    @Param('accountId') accountId: string,
    @Query('cursor') _cursor?: string,
    @Query('limit') _limit?: string,
  ) {
    return this.partner.listTransactions(accountId);
  }

  @Post('pix/payments')
  @RequireScopes('pix:write')
  @UseInterceptors(IdempotencyInterceptor)
  createPixPayment(@Body() body: Parameters<PartnerService['createPixPayment']>[0]) {
    return this.partner.createPixPayment(body);
  }

  @Get('pix/payments/:paymentId')
  @RequireScopes('pix:read')
  getPixPayment(@Param('paymentId') paymentId: string) {
    return this.partner.getPixPayment(paymentId);
  }
}