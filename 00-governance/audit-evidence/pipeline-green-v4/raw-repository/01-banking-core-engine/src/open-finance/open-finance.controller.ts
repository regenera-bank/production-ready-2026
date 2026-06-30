/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

/**
 * @file open-finance.controller.ts
 * @description REST controller — Open Finance / Prometeo proxy endpoints
 *
 * All routes are prefixed with /v1/open-finance (global prefix set in main.ts).
 *
 * @author    Paulo Ricardo de Leão  <paulo@regenerabank.app>
 * @id        RG-2098233287
 * @maintainer Raphaela Cerveski    <ceo@regenerabank.app>
 * @copyright 2026 Regenera Corporate Ltd. — All rights reserved.
 * @license   UNLICENSED
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { OpenFinanceService } from './open-finance.service';

class ConnectDto {
  provider: string;
  username: string;
  password: string;
}

@Controller('open-finance')
export class OpenFinanceController {
  constructor(private readonly svc: OpenFinanceService) {}

  /** GET /v1/open-finance/providers */
  @Get('providers')
  getProviders() {
    return this.svc.getProviders();
  }

  /**
   * POST /v1/open-finance/connect
   * Authenticates against the banking provider and returns a session key.
   * The session key is short-lived (~10 min) and belongs to the client session only.
   */
  @Post('connect')
  @HttpCode(HttpStatus.OK)
  connect(@Body() body: ConnectDto) {
    const { provider, username, password } = body;
    if (!provider || !username || !password) {
      throw new BadRequestException(
        'provider, username and password are required',
      );
    }
    return this.svc.login(provider, username, password);
  }

  /** GET /v1/open-finance/accounts?key=SESSION_KEY */
  @Get('accounts')
  getAccounts(@Query('key') key: string) {
    return this.svc.getAccounts(key);
  }

  /**
   * GET /v1/open-finance/transactions
   * ?key=SESSION_KEY&account=ACCOUNT_ID&currency=USD&date_start=01/01/2025&date_end=31/12/2025
   */
  @Get('transactions')
  getTransactions(
    @Query('key') key: string,
    @Query('account') accountId: string,
    @Query('currency') currency = 'USD',
    @Query('date_start') dateStart = '01/01/2025',
    @Query('date_end') dateEnd = '31/12/2025',
  ) {
    return this.svc.getTransactions(
      key,
      accountId,
      currency,
      dateStart,
      dateEnd,
    );
  }

  /** DELETE /v1/open-finance/disconnect?key=SESSION_KEY */
  @Delete('disconnect')
  @HttpCode(HttpStatus.OK)
  disconnect(@Query('key') key: string) {
    return this.svc.logout(key);
  }

  // Additional Open Finance endpoints (Prometeo powered)

  /** POST /v1/open-finance/payment-links { amount, description?, currency? } */
  @Post('payment-links')
  createPaymentLink(
    @Body() body: { amount: number; description?: string; currency?: string },
  ) {
    const { amount, description, currency } = body;
    if (!amount) throw new BadRequestException('amount is required');
    return this.svc.createPaymentLink(amount, description, currency);
  }

  /** GET /v1/open-finance/payment-links */
  @Get('payment-links')
  getPaymentLinks() {
    return this.svc.getPaymentLinks();
  }

  /** POST /v1/open-finance/validate-identity { document_number } */
  @Post('validate-identity')
  validateIdentity(@Body() body: { document_number: string }) {
    if (!body.document_number)
      throw new BadRequestException('document_number is required');
    return this.svc.validateIdentity(body.document_number);
  }
}
