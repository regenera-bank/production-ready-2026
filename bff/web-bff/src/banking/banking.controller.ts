import { randomUUID } from 'crypto';
import {
  Body,
  Controller,
  Get,
  Headers,
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
  transactions(@Req() req: AuthedRequest) {
    return { items: this.banking.getTransactions(req.session.userId) };
  }

  @Get('pix/keys')
  @UseGuards(SessionGuard)
  pixKeys(@Req() req: AuthedRequest) {
    return { items: this.banking.listPixKeys(req.session.userId) };
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
}