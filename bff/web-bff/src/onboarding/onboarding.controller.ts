import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { SessionRecord } from '../auth/auth.service';
import { BankingService } from '../banking/banking.service';
import { OnboardingService } from './onboarding.service';

type AuthedRequest = Request & { session: SessionRecord };

interface KycDocumentBody {
  fileBase64: string;
  type?: 'RG' | 'CNH';
}

interface KycSelfieBody {
  selfieBase64: string;
}

interface ProfileBody {
  document: string;
  displayName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
  };
}

@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly onboarding: OnboardingService,
    private readonly banking: BankingService,
  ) {}

  @Get('status')
  @UseGuards(SessionGuard)
  status(@Req() req: AuthedRequest) {
    return this.onboarding.getStatus(req.session.userId);
  }

  @Post('profile')
  @UseGuards(SessionGuard)
  updateProfile(@Req() req: AuthedRequest, @Body() body: ProfileBody) {
    return this.onboarding.updateProfile(req.session.userId, body);
  }

  @Post('kyc/submit')
  @UseGuards(SessionGuard)
  submitKyc(@Req() req: AuthedRequest) {
    return this.onboarding.submitKyc(req.session.userId);
  }

  @Post('kyc/retry')
  @UseGuards(SessionGuard)
  retryKyc(@Req() req: AuthedRequest) {
    return this.onboarding.resetCadastralKyc(req.session.userId);
  }

  @Post('kyc/document')
  @UseGuards(SessionGuard)
  submitDocument(@Req() req: AuthedRequest, @Body() body: KycDocumentBody) {
    return this.onboarding.submitDocument(
      req.session.userId,
      body.fileBase64,
      body.type ?? 'RG',
    );
  }

  @Post('kyc/selfie')
  @UseGuards(SessionGuard)
  submitSelfie(@Req() req: AuthedRequest, @Body() body: KycSelfieBody) {
    return this.onboarding.submitSelfie(req.session.userId, body.selfieBase64);
  }

  @Post('account/open')
  @UseGuards(SessionGuard)
  async openAccount(@Req() req: AuthedRequest) {
    this.onboarding.requireKycApproved(req.session.userId);
    const opened = await this.banking.openCustomerAccount(req.session.userId);
    this.onboarding.markAccountActive(req.session.userId);
    const welcomeCents = BigInt(opened.welcomeCreditCents);
    return {
      accountId: opened.accountId,
      accountStatus: 'ACTIVE' as const,
      welcomeCreditCents: opened.welcomeCreditCents,
      message:
        welcomeCents > 0n
          ? 'Conta aberta com R$ 1,00 de crédito homolog — pronta para operar'
          : 'Conta aberta — pronta para operar',
    };
  }
}