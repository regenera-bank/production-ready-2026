import { randomUUID } from 'crypto';
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { SessionRecord } from '../auth/auth.service';
import { BankingService } from './banking.service';
import { PixKeyItem } from './banking.dto';

type AuthedRequest = Request & { session: SessionRecord };

interface PixTransferBody {
  key: string;
  amountCents: string;
}

interface TransferBody {
  toDocument: string;
  amountCents: string;
}

interface PixKeyBody {
  key: string;
  type: PixKeyItem['type'];
}

interface PixLookupBody {
  key: string;
}

@Controller('banking')
export class BankingController {
  constructor(private readonly banking: BankingService) {}

  @Get('dashboard')
  @UseGuards(SessionGuard)
  dashboard(@Req() req: AuthedRequest) {
    return this.banking.getDashboard(req.session.userId);
  }

  @Get('transactions')
  @UseGuards(SessionGuard)
  async transactions(@Req() req: AuthedRequest) {
    return { items: await this.banking.getTransactions(req.session.userId) };
  }

  @Get('transactions/:transactionId/receipt')
  @UseGuards(SessionGuard)
  receipt(
    @Req() req: AuthedRequest,
    @Param('transactionId') transactionId: string,
  ) {
    return this.banking.getReceipt(req.session.userId, transactionId);
  }

  @Get('pix/keys')
  @UseGuards(SessionGuard)
  async pixKeys(@Req() req: AuthedRequest) {
    return { items: await this.banking.listPixKeys(req.session.userId) };
  }

  @Post('pix/keys')
  @UseGuards(SessionGuard)
  registerPixKey(@Req() req: AuthedRequest, @Body() body: PixKeyBody) {
    return this.banking.registerPixKey(
      req.session.userId,
      body.key,
      body.type ?? 'random',
    );
  }

  @Post('pix/lookup')
  @UseGuards(SessionGuard)
  lookupPixKey(@Body() body: PixLookupBody) {
    return this.banking.lookupPixKey(body.key);
  }

  @Get('payments/:paymentId')
  @UseGuards(SessionGuard)
  paymentStatus(
    @Req() req: AuthedRequest,
    @Param('paymentId') paymentId: string,
  ) {
    return this.banking.getPaymentStatus(req.session.userId, paymentId);
  }

  @Get('pix/transfers/:paymentId')
  @UseGuards(SessionGuard)
  pixTransferStatus(
    @Req() req: AuthedRequest,
    @Param('paymentId') paymentId: string,
  ) {
    return this.banking.getPixTransfer(req.session.userId, paymentId);
  }

  @Post('pix/transfers')
  @UseGuards(SessionGuard)
  sendPix(
    @Req() req: AuthedRequest,
    @Body() body: PixTransferBody,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.banking.sendPix(
      req.session.userId,
      body.key,
      BigInt(body.amountCents),
      idempotencyKey ?? `pix-${randomUUID()}`,
    );
  }

  @Post('transfers')
  @UseGuards(SessionGuard)
  transfer(
    @Req() req: AuthedRequest,
    @Body() body: TransferBody,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.banking.transfer(
      req.session.userId,
      body.toDocument,
      BigInt(body.amountCents),
      idempotencyKey ?? `transfer-${randomUUID()}`,
    );
  }

  @Get('pix/external/lookup/:key')
  @UseGuards(SessionGuard)
  externalPixLookup(@Param('key') key: string) {
    return {
      found: false,
      key,
      externalProviderActive: false,
      sandbox: true,
      message: 'EXTERNAL_ACTIVATION_REQUIRED — SPI/DICT produção não ativo',
    };
  }
}