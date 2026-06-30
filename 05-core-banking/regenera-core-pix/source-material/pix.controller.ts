// pix.controller.ts
//
// a borda HTTP do dinheiro. aqui valida forma; quem valida verdade é o
// serviço, dentro da transação. e desde a correção do guard, header de
// identidade sem sessão ACTIVE no banco morre com 401 antes de chegar
// em qualquer linha que toque saldo. era o buraco mais feio do core.

import { Body, Controller, Headers, HttpCode, Post, BadRequestException, Req } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RateLimit, RATE_LIMIT_POLICIES } from '../common/rate-limit.guard';
import { RequireSession, RequestUserContext } from '../auth/session-auth.guard';
import { PixPaymentService } from './pix-payment.service';
import { PixPaymentStatus } from '../domain/state-machines';

interface SubmitPixBody {
  receiverKey?: string;
  receiverIspb?: string | null;
  amountCents?: string;
  idempotencyKey?: string;
}

@Controller('pix')
export class PixController {
  constructor(private readonly pix: PixPaymentService) {}

  @Post('submit')
  @HttpCode(201)
  @RequireSession()
  @RateLimit(RATE_LIMIT_POLICIES.pixSubmit)
  async submit(
    @Body() body: SubmitPixBody,
    @Headers('x-ledger-account-id') ledgerAccountId: string | undefined,
    @Headers('x-device-fingerprint') deviceFingerprint: string | undefined,
    @Headers('x-correlation-id') correlationId: string | undefined,
    @Req() request: { user?: RequestUserContext },
  ): Promise<{ paymentId: string; internalEndToEndId: string; status: PixPaymentStatus }> {
    // request.user vem do SessionAuthGuard, que já bateu no banco.
    // se chegou aqui sem user, o guard foi removido do módulo — e isso
    // é erro de configuração que merece quebrar alto, não seguir quieto.
    const user = request.user;
    if (!user?.userId || !user.accountId) {
      throw new BadRequestException({ code: 'AUTH_CONTEXT_REQUIRED' });
    }
    if (!ledgerAccountId || !deviceFingerprint) {
      throw new BadRequestException({ code: 'AUTH_CONTEXT_REQUIRED' });
    }
    if (!body.receiverKey || !body.amountCents || !body.idempotencyKey) {
      throw new BadRequestException({ code: 'PIX_PAYLOAD_INVALID' });
    }
    return this.pix.create({
      senderAccountId: user.accountId,
      senderLedgerAccountId: ledgerAccountId,
      receiverKey: body.receiverKey,
      receiverIspb: body.receiverIspb ?? null,
      amountCents: body.amountCents,
      idempotencyKey: body.idempotencyKey,
      deviceFingerprint,
      correlationId: correlationId ?? randomUUID(),
    });
  }
}
