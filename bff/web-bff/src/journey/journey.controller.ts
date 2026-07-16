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
import { SessionRecord, AuthService } from '../auth/auth.service';
import { BankingService } from '../banking/banking.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { JourneyService } from './journey.service';
import type { CreateJourneyInput, JourneyChannel } from './journey.types';

type AuthedRequest = Request & { session: SessionRecord };

const parseChannel = (value: string | undefined): JourneyChannel => {
  const normalized = value?.trim().toUpperCase();
  if (
    normalized === 'WEB' ||
    normalized === 'ANDROID' ||
    normalized === 'IOS' ||
    normalized === 'DESKTOP' ||
    normalized === 'PWA'
  ) {
    return normalized;
  }
  return 'WEB';
};

interface V2JourneyContactBody {
  address?: string;
  zip?: string;
  state?: string;
  occupation?: string;
  income?: string;
  purpose?: string;
}

@Controller('onboarding/journeys')
export class JourneyController {
  constructor(
    private readonly journeys: JourneyService,
    private readonly onboarding: OnboardingService,
    private readonly banking: BankingService,
    private readonly auth: AuthService,
  ) {}

  @Post()
  @UseGuards(SessionGuard)
  async create(
    @Req() req: AuthedRequest,
    @Body() body: CreateJourneyInput,
    @Headers('x-channel-id') channelHeader?: string,
    @Headers('x-device-id') deviceHeader?: string,
  ) {
    const channel = parseChannel(body.channel ?? channelHeader);
    const deviceId = (body.deviceId ?? deviceHeader ?? '').trim();
    return this.journeys.createForUser(req.session.userId, {
      channel,
      deviceId: deviceId || `dev_${req.session.userId.slice(0, 8)}`,
      locale: body.locale,
      appVersion: body.appVersion,
      platformVersion: body.platformVersion,
    });
  }

  @Get('active')
  @UseGuards(SessionGuard)
  active(@Req() req: AuthedRequest) {
    const journey = this.journeys.getActiveForUser(req.session.userId);
    if (!journey) {
      return { found: false as const };
    }
    return { found: true as const, journey };
  }

  @Get(':journeyId')
  @UseGuards(SessionGuard)
  getOne(
    @Req() req: AuthedRequest,
    @Param('journeyId') journeyId: string,
    @Headers('if-match') ifMatch?: string,
  ) {
    const expected = ifMatch ? Number(ifMatch) : undefined;
    this.journeys.assertVersion(journeyId, req.session.userId, expected);
    return this.journeys.getForUser(req.session.userId, journeyId);
  }

  /** Compatível com regenera-real-flow-html-v2 */
  @Post(':journeyId/contact')
  @UseGuards(SessionGuard)
  saveContactV2(
    @Req() req: AuthedRequest,
    @Param('journeyId') journeyId: string,
    @Body() body: V2JourneyContactBody,
  ) {
    this.journeys.assertVersion(journeyId, req.session.userId);
    const user = this.auth.findUserById(req.session.userId);
    if (!user) {
      return { ok: false as const, journeyId };
    }
    const street = body.address?.trim() || user.address.street;
    const postalCode = body.zip?.trim() || user.address.postalCode;
    const state = body.state?.trim().toUpperCase().slice(0, 2) || user.address.state;
    this.onboarding.updateProfile(req.session.userId, {
      document: user.document,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate ?? '',
      address: {
        street,
        number: user.address.number || 'S/N',
        complement: user.address.complement,
        neighborhood: user.address.neighborhood || '—',
        city: user.address.city || '—',
        state,
        postalCode,
      },
    });
    return {
      ok: true as const,
      journeyId,
      customerDraftId: `cst_draft_${req.session.userId}`,
      purpose: body.purpose ?? 'personal',
    };
  }

  /** Compatível com regenera-real-flow-html-v2 */
  @Post(':journeyId/account')
  @UseGuards(SessionGuard)
  async openAccountV2(
    @Req() req: AuthedRequest,
    @Param('journeyId') journeyId: string,
  ) {
    this.journeys.assertVersion(journeyId, req.session.userId);
    this.onboarding.requireKycApproved(req.session.userId);
    const opened = await this.banking.openCustomerAccount(req.session.userId);
    this.onboarding.markAccountActive(req.session.userId);
    const welcomeCents = BigInt(opened.welcomeCreditCents);
    const accountSuffix = opened.accountId.replace(/[^0-9]/g, '').slice(-7) || '0000000';
    return {
      journeyId,
      accountId: opened.accountId,
      id: opened.accountId,
      accountNumber: `${accountSuffix}-0`,
      number: `${accountSuffix}-0`,
      agency: '0001',
      ledgerSequence: `seq_${accountSuffix.slice(0, 4)}`,
      accountStatus: 'ACTIVE' as const,
      message:
        welcomeCents > 0n
          ? 'Conta aberta com crédito homolog — pronta para operar'
          : 'Conta aberta — pronta para operar',
    };
  }
}